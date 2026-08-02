import os
import datetime
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey, func, desc
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import joblib
import pandas as pd
import numpy as np
from stable_baselines3 import PPO

# --- Database Setup ---
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "A123ebr123")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "dynamic_pricing")
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    base_cost = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    elasticity = Column(Float, nullable=False)

class SalesHistory(Base):
    __tablename__ = "sales_history"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    date = Column(Date, nullable=False)
    price = Column(Float, nullable=False)
    competitor_price = Column(Float, nullable=False)
    demand = Column(Integer, nullable=False)
    revenue = Column(Float, nullable=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Load Models ---
try:
    scaler = joblib.load('models/scaler.pkl')
    rf_model = joblib.load('models/demand_model.pkl')
    rl_agent = PPO.load('models/ppo_pricing_agent')
    models_loaded = True
except Exception as e:
    print(f"Warning: Models not loaded. Please run train_rl.py first. Error: {e}")
    models_loaded = False

# --- FastAPI App ---
app = FastAPI(title="Dynamic Pricing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return products

@app.get("/api/product/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    history = db.query(SalesHistory).filter(SalesHistory.product_id == product_id).order_by(SalesHistory.date.desc()).limit(30).all()
    
    return {
        "product": product,
        "history": history
    }

class ForecastRequest(BaseModel):
    product_id: int
    hypothetical_price: float
    competitor_price: float
    day_of_year: int

@app.post("/api/forecast")
def forecast_demand(req: ForecastRequest, db: Session = Depends(get_db)):
    if not models_loaded:
         raise HTTPException(status_code=503, detail="ML Models are not loaded.")
         
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    obs = np.array([req.hypothetical_price, req.competitor_price, req.day_of_year, product.base_cost, req.product_id], dtype=np.float32)
    obs_scaled = scaler.transform([obs])
    predicted_demand = max(0, rf_model.predict(obs_scaled)[0])
    
    return {
        "price": req.hypothetical_price,
        "predicted_demand": int(predicted_demand),
        "predicted_revenue": round(req.hypothetical_price * predicted_demand, 2),
        "predicted_profit": round((req.hypothetical_price - product.base_cost) * predicted_demand, 2)
    }

@app.get("/api/optimize/{product_id}")
def optimize_price(product_id: int, db: Session = Depends(get_db)):
    if not models_loaded:
         raise HTTPException(status_code=503, detail="ML Models are not loaded.")
         
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Get last known competitor price from history
    last_sale = db.query(SalesHistory).filter(SalesHistory.product_id == product_id).order_by(SalesHistory.date.desc()).first()
    comp_price = last_sale.competitor_price if last_sale else product.current_price
    
    day_of_year = datetime.datetime.now().timetuple().tm_yday
    
    obs = np.array([product.current_price, comp_price, day_of_year, product.base_cost, product_id], dtype=np.float32)
    
    # Get RL Action
    action, _states = rl_agent.predict(obs, deterministic=True)
    price_change = float(action[0])
    
    optimal_price = float(product.current_price * (1 + price_change))
    optimal_price = float(np.clip(optimal_price, product.base_cost * 1.01, product.base_cost * 3.0))
    
    # Forecast the demand for the new price
    obs_new = np.array([optimal_price, comp_price, day_of_year, product.base_cost, product_id], dtype=np.float32)
    obs_new_scaled = scaler.transform([obs_new])
    predicted_demand = int(max(0, float(rf_model.predict(obs_new_scaled)[0])))
    
    return {
        "current_price": float(product.current_price),
        "optimal_price": round(optimal_price, 2),
        "price_change_percentage": round(price_change * 100, 2),
        "predicted_demand": predicted_demand,
        "predicted_profit": round((optimal_price - float(product.base_cost)) * predicted_demand, 2)
    }

class ApplyPriceRequest(BaseModel):
    new_price: float

@app.post("/api/apply_price/{product_id}")
def apply_price(product_id: int, req: ApplyPriceRequest, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product.current_price = req.new_price
    db.commit()
    
    return {"status": "success", "new_price": product.current_price}

@app.get("/api/summary")
def get_summary(db: Session = Depends(get_db)):
    total_revenue = db.query(func.sum(SalesHistory.revenue)).scalar() or 0
    total_products = db.query(Product).count()
    
    # Revenue by category
    category_revenue = db.query(
        Product.category, 
        func.sum(SalesHistory.revenue).label('revenue')
    ).join(SalesHistory, Product.id == SalesHistory.product_id).group_by(Product.category).all()
    
    # Global sales trend (last 30 days)
    global_trend = db.query(
        SalesHistory.date,
        func.sum(SalesHistory.revenue).label('revenue')
    ).group_by(SalesHistory.date).order_by(SalesHistory.date.desc()).limit(30).all()
    
    # Top 5 products
    top_products = db.query(
        Product.id,
        Product.name,
        Product.category,
        func.sum(SalesHistory.revenue).label('total_revenue')
    ).join(SalesHistory, Product.id == SalesHistory.product_id).group_by(Product.id).order_by(desc('total_revenue')).limit(5).all()

    return {
        "total_revenue": float(total_revenue),
        "total_products": total_products,
        "revenue_by_category": [{"name": c[0], "value": float(c[1])} for c in category_revenue],
        "global_trend": [{"date": t[0].strftime("%Y-%m-%d"), "revenue": float(t[1])} for t in reversed(global_trend)],
        "top_products": [{"id": p[0], "name": p[1], "category": p[2], "revenue": float(p[3])} for p in top_products]
    }
