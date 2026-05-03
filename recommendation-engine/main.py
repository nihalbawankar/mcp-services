from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List
from openai import OpenAI
import os

app = FastAPI(title="Recommendation Engine", version="1.0.0")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class RecommendationRequest(BaseModel):
    user_id: str
    context: Optional[str] = ""
    history: Optional[List[str]] = []
    limit: Optional[int] = 5


@app.get("/health")
def health():
    return {"status": "healthy", "service": "recommendation-engine"}


@app.post("/recommend")
def recommend(req: RecommendationRequest):
    history_text = "\n".join(req.history) if req.history else "No history available"
    prompt = f"""User ID: {req.user_id}
Context: {req.context}
User history: {history_text}

Based on this user's history and context, provide {req.limit} personalized recommendations.
Return as a JSON array with fields: id, title, reason, score (0-1)."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return {
        "user_id": req.user_id,
        "recommendations": response.choices[0].message.content,
    }


@app.post("/similar/{item_id}")
def similar_items(item_id: str, limit: int = 5):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": f"Generate {limit} items similar to item ID: {item_id}. Return as JSON array with id, title, similarity_score."
        }],
    )
    return {"item_id": item_id, "similar": response.choices[0].message.content}
