import httpx
from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/v1/flags", tags=["flags"])

TRIAGE_SERVICE_URL = "http://triage:8005"

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_triage(path: str, request: Request):
    url = f"{TRIAGE_SERVICE_URL}/api/v1/flags/{path}"
    
    # If path is empty, we hit /api/v1/flags
    if not path:
        url = f"{TRIAGE_SERVICE_URL}/api/v1/flags"

    try:
        body = await request.body()
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=request.method,
                url=url,
                headers=dict(request.headers),
                content=body,
                timeout=30.0
            )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
