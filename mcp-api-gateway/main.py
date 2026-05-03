from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MCP API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES = {
    "auth":           os.getenv("AUTH_SERVICE_URL",           "http://auth-service:8001"),
    "model":          os.getenv("MODEL_SERVICE_URL",          "http://model-service:8002"),
    "ai-assistant":   os.getenv("AI_ASSISTANT_URL",           "http://ai-assistant:8003"),
    "recommendation": os.getenv("RECOMMENDATION_ENGINE_URL",  "http://recommendation-engine:8004"),
    "product":        os.getenv("PRODUCT_SERVICE_URL",        "http://product-service:8005"),
    "user":           os.getenv("USER_SERVICE_URL",           "http://user-service:8006"),
    "payment":        os.getenv("PAYMENT_SERVICE_URL",        "http://payment-service:8007"),
    "control-plane":  os.getenv("MCP_CONTROL_PLANE_URL",      "http://mcp-control-plane:8008"),
}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "mcp-api-gateway"}


@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(service: str, path: str, request: Request):
    if service not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Service '{service}' not found")

    url = f"{SERVICES[service]}/{path}"
    body = await request.body()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(
                method=request.method,
                url=url,
                headers={k: v for k, v in request.headers.items() if k.lower() != "host"},
                content=body,
                params=dict(request.query_params),
            )
    except httpx.ConnectError:
        logger.error(f"Cannot reach {service} at {url}")
        raise HTTPException(status_code=503, detail=f"Service '{service}' is unavailable")
    except httpx.TimeoutException:
        logger.error(f"Timeout reaching {service} at {url}")
        raise HTTPException(status_code=504, detail=f"Service '{service}' timed out")

    logger.info(f"Proxied {request.method} /{service}/{path} -> {resp.status_code}")

    try:
        return resp.json()
    except Exception:
        return JSONResponse(content=resp.text, status_code=resp.status_code)
