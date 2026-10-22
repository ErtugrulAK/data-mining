# Dynamic Pricing AI: End-to-End E-Commerce Optimization System

This project is a comprehensive full-stack machine learning solution that leverages data mining, regression modeling, and reinforcement learning to develop optimal dynamic pricing strategies for e-commerce platforms. The system forecasts customer demand from historical sales data and uses an AI agent to determine optimal pricing that maximizes profitability.

---

## 1. Architecture Overview

The system consists of three primary layers:

### A. Data Layer (MySQL & Python Synthetic Generator)
- **Database:** MySQL relational database (`dynamic_pricing`).
- **Data Generation:** Synthetic data engine via `setup_db.py`.
- **Scope:** 100 unique products with 2 years of daily sales history (~73,000 transaction records).
- **Variables:** Simulates price elasticity, seasonality trends, competitor pricing dynamics, and product cost structures.

### B. Backend & Machine Learning Layer (FastAPI & AI Pipelines)
- **API Server:** Python-based FastAPI backend operating on port 8000.
- **Demand Forecasting Model:** **Random Forest Regressor** (`scikit-learn`) predicting demand based on current price, competitor pricing, day of year, base cost, and product ID.
- **Policy Optimization Model:** **Proximal Policy Optimization (PPO)** Reinforcement Learning agent (`stable-baselines3`).
- **Custom RL Environment:** Custom Gymnasium environment (`PricingEnv`). The agent utilizes the Random Forest demand model as a world simulator to discover reward-maximizing pricing actions.

### C. Frontend Presentation Layer (Next.js & Tailwind CSS)
- **Dashboard:** Responsive Next.js 16 application operating on port 3000.
- **Theme System:** Dynamic Dark and Light mode support with persistent state.
- **Data Visualization:** Recharts library integration rendering real-time market trends, category revenue breakdown, and store performance metrics.

---

## 2. Technology Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Lucide React, Recharts.
- **Backend:** FastAPI, SQLAlchemy, PyMySQL, Uvicorn, Pydantic.
- **AI / ML / Data Mining:** Scikit-Learn (Random Forest), Stable-Baselines3 (RL - PPO), Gymnasium, Pandas, NumPy, Joblib.
- **Database:** MySQL 8.0+.

---

## 3. How the AI Pipeline Works

The system operates on a **"Model-in-the-Loop"** architecture:

1. **Learning Phase:** The Random Forest regressor fits the ~73,000 generated sales rows in full (no train/test split and no accuracy metrics were recorded; see the README for the honest evaluation caveat).
2. **Simulation Phase:** The reinforcement learning agent trains inside `PricingEnv` for 10,000 environment steps (PPO, MlpPolicy), using the fitted Random Forest model to score each candidate price.
3. **Decision Phase:** Once the agent identifies the profit-maximizing equilibrium between price and forecasted demand, it recommends the "Optimal Price" to the store operator.

---

## 4. Execution & Setup Guide

### Setup Steps
1. **Database:** Ensure MySQL server is active locally.
2. **Data Generation:** From `backend/`, run `python setup_db.py` to create tables and generate historical data.
3. **Model Training:** From `backend/`, run `python train_rl.py` to train both Random Forest and PPO models (artifacts are written to `backend/models/` relative to the working directory, so run the script from that directory).
4. **Backend:** Launch the API server from `backend/` using `uvicorn main:app --port 8000`.
5. **Frontend:** Launch the interface from `frontend/` using `npm run dev`.

### Dashboard Features
- **Global Overview:** High-level overview of revenue metrics, top-performing products, and category distribution.
- **Price Optimizer:** Select catalog items, trigger instant RL price optimization, and apply recommendations with one click.
- **Light/Dark Toggle:** Seamlessly switch dashboard appearance.

---

## 5. Data Mining & Academic Value

By combining data preprocessing, synthetic feature engineering, regression modeling, and algorithmic decision-making (RL), this project demonstrates end-to-end data mining principles applied to real-world financial optimization problems.

