import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from uuid import UUID, uuid4
from pathlib import Path

import joblib
import shap
import scipy.sparse as sp
import numpy as np

from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession

from hrip_shared.broker import RedisStreamBroker
from hrip_shared.contracts.events import CleanedMessageEvent, DetectionEvent
from hrip_shared.db import Detection, DetectionFeature, session_factory, wait_for_db
from hrip_shared.services.idempotency import already_processed, mark_processed
from hrip_shared.settings import get_settings
from hrip_shared.utils.streams import CLEANED_MESSAGE_STREAM, DETECTION_STREAM

from .engine.rules import rules_score, classify_threat, intel_matches, optional_roberta_confidence, extract_features

broker = RedisStreamBroker()
settings = get_settings()
logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent.parent.parent / "models" / "saved"

class ModelCache:
    vectorizer = None
    clf = None
    explainer = None
    feature_names = None

async def process_cleaned_message(entry_id: str, payload: dict) -> None:
    event = CleanedMessageEvent.model_validate(payload)
    async with session_factory() as session:
        if await already_processed(session, "detection", entry_id):
            return
            
        score, psychology = rules_score(event.cleaned_text)
        intel_hit = intel_matches(event.extracted_urls)
        
        lgbm_conf = 0.0
        top_features = []
        
        if ModelCache.clf:
            # 1. Feature Extraction
            X_tfidf = ModelCache.vectorizer.transform([event.cleaned_text])
            psycho_features = extract_features(event.cleaned_text)
            X_custom = sp.csr_matrix([psycho_features])
            X_combined = sp.hstack([X_tfidf, X_custom]).tocsr()
            
            # 2. Prediction
            preds = ModelCache.clf.predict_proba(X_combined)
            lgbm_conf = float(preds[0][1]) # probability of class 1
            
            # 3. SHAP Explainability
            shap_values = ModelCache.explainer.shap_values(X_combined)
            # TreeExplainer usually returns a list [class0, class1] or single array
            sv = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
            if len(sv.shape) > 1 and sv.shape[1] == 2:
                # newer shap versions return (samples, features, classes)
                sv = sv[:, 1]
                
            # Get top 3 features by absolute SHAP contribution
            top_indices = np.argsort(np.abs(sv))[-3:][::-1]
            for idx in top_indices:
                val = float(X_combined[0, idx])
                contrib = float(sv[idx])
                name = str(ModelCache.feature_names[idx])
                top_features.append((name, val, contrib))
        else:
            logger.warning("ML Model not loaded, falling back to 0.0 score.")
            top_features = [("fallback", 0.0, 0.0)]

        # Qwen 2.5 Integration (Phase 2)
        from .engine.qwen_analyzer import run_qwen_analyzer
        qwen_result = None
        if lgbm_conf < 0.15:
            # Obviously benign — skip Qwen entirely
            final_confidence = lgbm_conf
            model_used = "lgbm"
            threat_type = classify_threat(event.cleaned_text, event.channel, intel_hit)
        else:
            # Escalate to Qwen for final verdict
            qwen_result = run_qwen_analyzer(event.cleaned_text, event.channel)
            if qwen_result:
                final_confidence = qwen_result.get("threat_probability", lgbm_conf)
                model_used = "qwen"
                threat_type = qwen_result.get("detected_intent", classify_threat(event.cleaned_text, event.channel, intel_hit))
            else:
                final_confidence = lgbm_conf
                model_used = "lgbm"
                threat_type = classify_threat(event.cleaned_text, event.channel, intel_hit)

        confidence = final_confidence
        roberta_conf = 0.0  # Deprecated
        
        detection_id = str(uuid4())
        detection_row = Detection(
            id=detection_id,
            message_id=str(event.message_id),
            threat_type=threat_type,
            confidence=confidence,
            model_used=model_used,
            rules_score=score,
            lgbm_confidence=lgbm_conf,
            roberta_confidence=roberta_conf,
            intel_hit=intel_hit,
            psychology_scores=psychology,
        )
        session.add(detection_row)
        
        for name, value, contrib in top_features:
            session.add(
                DetectionFeature(
                    detection_id=detection_id,
                    feature_name=name,
                    feature_value=value,
                    shap_contribution=contrib,
                )
            )

        if qwen_result:
            if "reasoning" in qwen_result:
                session.add(
                    DetectionFeature(
                        detection_id=detection_id,
                        feature_name="qwen_narrative",
                        feature_value=0.0,
                        feature_string=str(qwen_result["reasoning"]),
                        shap_contribution=0.0
                    )
                )
            if "detected_intent" in qwen_result:
                session.add(
                    DetectionFeature(
                        detection_id=detection_id,
                        feature_name="qwen_intent",
                        feature_value=0.0,
                        feature_string=str(qwen_result["detected_intent"]),
                        shap_contribution=0.0
                    )
                )
        await session.commit()
        
        outbound = DetectionEvent(
            message_id=event.message_id,
            detection_id=UUID(detection_id),
            threat_type=threat_type,
            confidence=confidence,
            model_used=model_used,
            rules_score=score,
            lgbm_confidence=lgbm_conf,
            roberta_confidence=roberta_conf,
            intel_hit=intel_hit,
            shap_features=[
                {"feature": name, "value": value, "contribution": contrib} for name, value, contrib in top_features
            ],
            psychology_scores=psychology,
        )
        await broker.publish(DETECTION_STREAM, outbound.model_dump(mode="json"), event_id=entry_id)
        await mark_processed(session, "detection", entry_id)

@asynccontextmanager
async def lifespan(_: FastAPI):
    await wait_for_db()
    
    # Load ML Artifacts
    lgbm_path = MODEL_DIR / "lgbm_model.pkl"
    vec_path = MODEL_DIR / "tfidf_vectorizer.pkl"
    if lgbm_path.exists() and vec_path.exists():
        logger.info("Loading LightGBM model and SHAP Explainer...")
        ModelCache.clf = joblib.load(lgbm_path)
        ModelCache.vectorizer = joblib.load(vec_path)
        
        # We use check_additivity=False to avoid assertions in sparse matrices if any precision loss
        ModelCache.explainer = shap.TreeExplainer(ModelCache.clf)
        
        tfidf_names = ModelCache.vectorizer.get_feature_names_out()
        custom_names = ["urgency", "authority", "fear", "financial", "secrecy", "scarcity", "rules_score", "text_length"]
        ModelCache.feature_names = np.concatenate([tfidf_names, custom_names])
        logger.info("ML Models successfully loaded in memory.")
    else:
        logger.error(f"Models not found at {MODEL_DIR}")

    task = asyncio.create_task(
        broker.consume_forever(CLEANED_MESSAGE_STREAM, "detection", "det-1", process_cleaned_message)
    )
    yield
    task.cancel()

app = FastAPI(title="hrip-detection", lifespan=lifespan)

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "detection", "time": datetime.now(UTC).isoformat()}

