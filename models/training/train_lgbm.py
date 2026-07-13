import pandas as pd
import numpy as np
import lightgbm as lgb
import joblib
import os
import sys
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, f1_score
from scipy.sparse import hstack, csr_matrix
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Ensure hrip_shared and services are in path to import rules
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(PROJECT_ROOT))
from services.detection.app.engine.rules import rules_score

def extract_custom_features(texts):
    features = []
    for text in texts:
        score, psycho = rules_score(text)
        features.append([
            psycho.get("urgency", 0),
            psycho.get("authority", 0),
            psycho.get("fear", 0),
            psycho.get("financial", 0),
            psycho.get("secrecy", 0),
            psycho.get("scarcity", 0),
            score / 100.0,
            len(text) / 1000.0, # normalized length
        ])
    return csr_matrix(features)

def main():
    data_path = PROJECT_ROOT / "data" / "training" / "dataset.csv"
    model_dir = PROJECT_ROOT / "models" / "saved"
    model_dir.mkdir(parents=True, exist_ok=True)
    
    logging.info(f"Loading dataset from {data_path}...")
    if not data_path.exists():
        logging.error("Dataset not found. Run download_datasets.py first.")
        return
        
    df = pd.read_csv(data_path)
    df.dropna(subset=['text', 'label'], inplace=True)
    
    X_text = df['text'].values
    y = df['label'].values
    
    logging.info("Splitting dataset into train and validation...")
    X_train_text, X_val_text, y_train, y_val = train_test_split(X_text, y, test_size=0.2, random_state=42)
    
    logging.info("Extracting TF-IDF features...")
    vectorizer = TfidfVectorizer(max_features=3000, stop_words="english", ngram_range=(1, 2))
    X_train_tfidf = vectorizer.fit_transform(X_train_text)
    X_val_tfidf = vectorizer.transform(X_val_text)
    
    logging.info("Extracting custom psychological features...")
    X_train_custom = extract_custom_features(X_train_text)
    X_val_custom = extract_custom_features(X_val_text)
    
    logging.info("Combining features...")
    X_train = hstack([X_train_tfidf, X_train_custom]).tocsr()
    X_val = hstack([X_val_tfidf, X_val_custom]).tocsr()
    
    logging.info(f"Train matrix shape: {X_train.shape}")
    logging.info(f"Validation matrix shape: {X_val.shape}")
    
    logging.info("Training LightGBM model...")
    clf = lgb.LGBMClassifier(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=7,
        num_leaves=64,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    clf.fit(X_train, y_train)
    
    logging.info("Evaluating model...")
    y_pred = clf.predict(X_val)
    f1 = f1_score(y_val, y_pred)
    logging.info(f"Validation F1 Score: {f1:.4f}")
    print(classification_report(y_val, y_pred, target_names=["Benign (0)", "Phishing/Spam (1)"]))
    
    logging.info("Saving model and vectorizer...")
    joblib.dump(vectorizer, model_dir / "tfidf_vectorizer.pkl")
    joblib.dump(clf, model_dir / "lgbm_model.pkl")
    logging.info(f"Artifacts saved to {model_dir}")

if __name__ == "__main__":
    main()
