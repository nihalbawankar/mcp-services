from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os

app = FastAPI(title="Product Service", version="1.0.0")

products_db = {
    "p001": {"id": "p001", "name": "AI Widget", "price": 29.99, "stock": 100, "category": "tech"},
    "p002": {"id": "p002", "name": "ML Toolkit", "price": 99.99, "stock": 50,  "category": "software"},
}


class Product(BaseModel):
    id: str
    name: str
    price: float
    stock: int
    category: Optional[str] = "general"


@app.get("/health")
def health():
    return {"status": "healthy", "service": "product-service"}


@app.get("/products")
def list_products(category: Optional[str] = None):
    products = list(products_db.values())
    if category:
        products = [p for p in products if p.get("category") == category]
    return {"products": products, "total": len(products)}


@app.get("/products/{product_id}")
def get_product(product_id: str):
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    return products_db[product_id]


@app.post("/products")
def create_product(product: Product):
    products_db[product.id] = product.dict()
    return {"message": "Product created", "product": product}


@app.put("/products/{product_id}")
def update_product(product_id: str, product: Product):
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    products_db[product_id] = product.dict()
    return {"message": "Product updated", "product": product}


@app.delete("/products/{product_id}")
def delete_product(product_id: str):
    products_db.pop(product_id, None)
    return {"message": "Product deleted"}
