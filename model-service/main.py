from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List
from openai import OpenAI
import os

app = FastAPI(title="Model Service", version="1.0.0")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class InferenceRequest(BaseModel):
    model_id: str
    prompt: str
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7
    system: Optional[str] = "You are a helpful assistant."


class InferenceResponse(BaseModel):
    model_id: str
    response: str
    usage: dict


MODEL_MAP = {
    "gpt-4o":        "gpt-4o",
    "gpt-4o-mini":   "gpt-4o-mini",
    "gpt-4-turbo":   "gpt-4-turbo",
}


@app.get("/health")
def health():
    return {"status": "healthy", "service": "model-service"}


@app.post("/inference", response_model=InferenceResponse)
def run_inference(req: InferenceRequest):
    model = MODEL_MAP.get(req.model_id, req.model_id)
    message = client.chat.completions.create(
        model=model,
        max_tokens=req.max_tokens,
        temperature=req.temperature,
        messages=[
            {"role": "system", "content": req.system},
            {"role": "user",   "content": req.prompt},
        ]
    )
    return InferenceResponse(
        model_id=req.model_id,
        response=message.choices[0].message.content,
        usage={
            "input_tokens":  message.usage.prompt_tokens,
            "output_tokens": message.usage.completion_tokens,
        }
    )


@app.get("/models")
def list_models():
    return {"models": list(MODEL_MAP.keys())}
