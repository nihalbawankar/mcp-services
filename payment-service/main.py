from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid

app = FastAPI(title="Payment Service", version="1.0.0")

payments_db = {}


class PaymentRequest(BaseModel):
    user_id: str
    product_id: str
    amount: float
    currency: Optional[str] = "USD"
    payment_method: Optional[str] = "card"


class PaymentResponse(BaseModel):
    payment_id: str
    status: str
    amount: float
    currency: str


@app.get("/health")
def health():
    return {"status": "healthy", "service": "payment-service"}


@app.post("/payments", response_model=PaymentResponse)
def process_payment(req: PaymentRequest):
    payment_id = str(uuid.uuid4())
    payment = {
        "payment_id": payment_id,
        "user_id": req.user_id,
        "product_id": req.product_id,
        "amount": req.amount,
        "currency": req.currency,
        "status": "completed",
        "payment_method": req.payment_method,
    }
    payments_db[payment_id] = payment
    return PaymentResponse(
        payment_id=payment_id,
        status="completed",
        amount=req.amount,
        currency=req.currency,
    )


@app.get("/payments/{payment_id}")
def get_payment(payment_id: str):
    if payment_id not in payments_db:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payments_db[payment_id]


@app.get("/payments/user/{user_id}")
def get_user_payments(user_id: str):
    user_payments = [p for p in payments_db.values() if p["user_id"] == user_id]
    return {"payments": user_payments, "total": len(user_payments)}
