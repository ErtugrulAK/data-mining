import os
import pymysql
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timedelta

DB_USER = "root"
DB_PASS = "A123ebr123"
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "dynamic_pricing"

# 1. Create database if it doesn't exist
try:
    conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, port=int(DB_PORT))
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    cursor.execute(f"USE {DB_NAME}")
    conn.commit()
    conn.close()
    print(f"Database {DB_NAME} ensured.")
except Exception as e:
    print(f"Error connecting to MySQL: {e}")
    exit(1)

# 2. Setup SQLAlchemy
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)
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

# Create tables
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# 3. Generate Synthetic Data
if db.query(Product).count() == 0:
    print("Generating synthetic data...")
    np.random.seed(42)
    categories = ['Electronics', 'Clothing', 'Home & Garden', 'Beauty', 'Sports']
    
    products_data = []
    for i in range(1, 101): # 100 products
        cat = np.random.choice(categories)
        if cat == 'Electronics':
            base_cost = np.random.uniform(50, 500)
            elast = np.random.uniform(1.2, 2.5) # highly elastic
        elif cat == 'Clothing':
            base_cost = np.random.uniform(10, 80)
            elast = np.random.uniform(1.5, 3.0)
        else:
            base_cost = np.random.uniform(5, 150)
            elast = np.random.uniform(0.8, 2.0)
            
        initial_price = base_cost * np.random.uniform(1.2, 2.0)
        
        products_data.append(Product(
            name=f"{cat} Product {i}",
            category=cat,
            base_cost=round(base_cost, 2),
            current_price=round(initial_price, 2),
            elasticity=round(elast, 2)
        ))
    
    db.add_all(products_data)
    db.commit()
    
    # Generate 2 years of daily data
    print("Generating 2 years of sales history (~73,000 rows)...")
    products = db.query(Product).all()
    start_date = datetime.now().date() - timedelta(days=730)
    
    sales_data = []
    batch_size = 5000
    
    for p in products:
        base_demand = np.random.randint(20, 100)
        
        # Seasonality factors based on category
        peak_day_1 = 330 # Black friday roughly
        peak_day_2 = np.random.randint(1, 365)
        
        for day in range(730):
            current_date = start_date + timedelta(days=day)
            day_of_year = current_date.timetuple().tm_yday
            
            # Simulate pricing strategy changes over time
            # Price varies around base_cost * margin
            margin = np.random.uniform(1.1, 2.5)
            daily_price = max(p.base_cost + 1, p.base_cost * margin)
            
            # Competitor price follows roughly
            comp_price = daily_price * np.random.uniform(0.9, 1.1)
            
            # Calculate seasonality multiplier
            seasonality = 1.0 + 0.5 * np.exp(-0.5 * ((day_of_year - peak_day_1) / 10.0)**2) \
                              + 0.3 * np.exp(-0.5 * ((day_of_year - peak_day_2) / 15.0)**2)
            
            # Price effect: Q = A * P^(-elasticity)
            # A is base_demand
            # We scale it so that when daily_price == p.current_price, demand is roughly base_demand
            price_effect = (daily_price / p.current_price) ** (-p.elasticity)
            comp_effect = (comp_price / daily_price) ** (p.elasticity * 0.5)
            
            raw_demand = base_demand * price_effect * comp_effect * seasonality
            noise = np.random.normal(1.0, 0.15)
            final_demand = max(0, int(raw_demand * noise))
            
            sales_data.append(SalesHistory(
                product_id=p.id,
                date=current_date,
                price=round(daily_price, 2),
                competitor_price=round(comp_price, 2),
                demand=final_demand,
                revenue=round(final_demand * daily_price, 2)
            ))
            
            if len(sales_data) >= batch_size:
                db.add_all(sales_data)
                db.commit()
                sales_data = []

    if sales_data:
        db.add_all(sales_data)
        db.commit()
        
    print("Database populated successfully!")
else:
    print("Database already contains data.")

db.close()
