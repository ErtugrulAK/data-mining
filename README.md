# Nexus Pricing AI — End-to-End Dynamic Pricing Optimization System

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&logoColor=white)
![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-Random%20Forest-orange?logo=scikit-learn&logoColor=white)
![Stable--Baselines3](https://img.shields.io/badge/Stable--Baselines3-PPO%20RL-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)

An enterprise-grade, full-stack machine learning application that optimizes e-commerce pricing strategies in real time. **Nexus Pricing AI** combines **Random Forest Regressor** demand modeling with a **Proximal Policy Optimization (PPO)** Reinforcement Learning agent operating within a custom Gymnasium environment to maximize revenue and profit margins.

---

## 🌟 Key Features

- 📊 **Real-Time Market Analytics Dashboard:** Built with Next.js 15, Recharts, and Framer Motion for viewing sales trends, category performance, and store-wide revenue metrics.
- 📈 **Demand Elasticity Forecasting:** Uses a trained Random Forest Regressor to predict unit demand based on historical pricing, competitor pricing, seasonality, and product cost structure.
- 🤖 **Model-in-the-Loop Reinforcement Learning:** Features a PPO agent (`stable-baselines3`) that simulates millions of pricing strategies in a custom Gymnasium environment (`PricingEnv`) to identify profit-maximizing price points.
- ⚡ **One-Click Strategy Execution:** Select any catalog item, trigger AI price optimization, inspect projected profit margins, and update store pricing with a single click.
- 🌓 **Dynamic Theme Switching:** Dark and Light mode dashboard themes designed for presentation environments.

---

## 🏗️ System Architecture

```
                                +-------------------------+
                                |      MySQL Database     |
                                |  (products & history)   |
                                +------------+------------+
                                             |
                                             v
                                +------------+------------+
                                |   Random Forest Model   |
                                |   (Demand Simulator)    |
                                +------------+------------+
                                             |
                                             v
                                +------------+------------+
                                |  Gymnasium PricingEnv   |
                                |   & PPO Policy Agent    |
                                +------------+------------+
                                             |
                                             v
                                +------------+------------+
                                |    FastAPI REST Engine  |
                                |     (Port 8000)         |
                                +------------+------------+
                                             |
                                             v
                                +------------+------------+
                                |   Next.js 15 Dashboard  |
                                |     (Port 3000)         |
                                +-------------------------+
```

### Machine Learning Pipeline

1. **Synthetic Data Engine (`backend/setup_db.py`):** Generates 2 years of daily transactional history (~73,000 rows) across 100 products, modeling real-world price elasticity, seasonal demand peaks (e.g., Black Friday), and competitor reaction noise.
2. **Demand Model (`backend/train_rl.py`):** Fits a `RandomForestRegressor` on features `[price, competitor_price, day_of_year, base_cost, product_id]` to estimate market demand.
3. **PPO Policy Agent:** The PPO agent interacts with `PricingEnv`, selecting continuous price changes ($\pm 20\%$). It evaluates predicted unit demand and resulting net profit $(P - C) \times Q$ to learn optimal pricing policies under competitive constraints.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, Lucide Icons |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, PyMySQL, Pydantic |
| **Machine Learning** | Scikit-Learn, Stable-Baselines3 (PPO), Gymnasium, Pandas, NumPy, Joblib |
| **Database** | MySQL 8.0+ |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** v18.0 or higher
- **Python:** v3.10 or higher
- **MySQL Server:** Running on `localhost:3306`

### 1. Repository Setup & Environment
Clone the repository and copy the environment configuration templates:

```bash
# Clone repository
git clone https://github.com/ErtugrulAK/data-mining.git
cd data-mining

# Create environment config files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Automated Setup (Windows)
Run the setup batch script to install Node dependencies and set up the Python virtual environment:

```cmd
kurulum.bat
```

*Or manually install dependencies:*
```bash
# Backend Setup
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux/macOS: source venv/bin/activate
pip install -r requirements.txt

# Frontend Setup
cd ../frontend
npm install
```

### 3. Database Initialization & AI Training
Execute database population and model training scripts from the `backend/` directory:

```bash
cd backend

# Step A: Create database & generate historical sales data
python setup_db.py

# Step B: Train Demand Regressor & PPO RL Agent (Saves to backend/models/)
python train_rl.py
```

### 4. Running the System
Start both the FastAPI backend server and Next.js frontend application:

**Terminal 1 — Backend API (Port 8000):**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend Dashboard (Port 3000):**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the dashboard.

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieves all product catalog items |
| `GET` | `/api/product/{id}` | Retrieves detailed metadata and 30-day sales history for a product |
| `POST` | `/api/forecast` | Predicts demand, revenue, and profit for hypothetical pricing |
| `GET` | `/api/optimize/{id}` | Executes PPO RL agent to generate optimal price recommendations |
| `POST` | `/api/apply_price/{id}`| Updates a product's current price in the database |
| `GET` | `/api/summary` | Provides store-wide revenue KPIs, category distributions, and trend data |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
DB_USER=root
DB_PASS=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dynamic_pricing
```

### Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📁 Repository Structure

```
data-mining/
├── README.md                           # Main Project Documentation
├── PROJECT_DETAILS.md                  # Comprehensive Technical Specifications
├── kurulum.bat                         # Automated Windows Setup Script
├── backend/                            # FastAPI & Machine Learning Engine
│   ├── main.py                         # FastAPI Endpoints & Database Connection
│   ├── setup_db.py                     # DB Setup & Synthetic Data Engine
│   ├── train_rl.py                     # Random Forest & PPO RL Training Script
│   ├── requirements.txt                # Python Dependencies
│   ├── .env.example                    # Backend Environment Template
│   └── models/                         # Trained ML Models (.pkl, .zip)
└── frontend/                           # Next.js 15 Interactive Dashboard
    ├── package.json                    # Node Dependencies
    ├── next.config.ts                  # Next.js Configuration
    ├── tsconfig.json                   # TypeScript Compiler Settings
    ├── .env.example                    # Frontend Environment Template
    └── src/
        └── app/                        # Next.js App Router & UI Components
```

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
