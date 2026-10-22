import os
import pymysql
import pandas as pd
import numpy as np
import gymnasium as gym
from gymnasium import spaces
from sqlalchemy import create_engine
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from stable_baselines3 import PPO
import joblib
import warnings

warnings.filterwarnings('ignore')
from config import DATABASE_URL, validate_db_password

validate_db_password()
engine = create_engine(DATABASE_URL)

os.makedirs('models', exist_ok=True)

# 1. Load Data
print("Loading data from database...")
sales_df = pd.read_sql("SELECT * FROM sales_history", con=engine)
products_df = pd.read_sql("SELECT * FROM products", con=engine)

sales_df['date'] = pd.to_datetime(sales_df['date'])
sales_df['day_of_year'] = sales_df['date'].dt.dayofyear
sales_df['month'] = sales_df['date'].dt.month

df = sales_df.merge(products_df, left_on='product_id', right_on='id', suffixes=('', '_prod'))

print(f"Data loaded: {len(df)} rows.")

# 2. Train Demand Forecasting Model
print("Training Demand Forecasting Model...")
features = ['price', 'competitor_price', 'day_of_year', 'base_cost', 'product_id']
target = 'demand'

X = df[features]
y = df[target]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

rf_model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
rf_model.fit(X_scaled, y)

joblib.dump(scaler, 'models/scaler.pkl')
joblib.dump(rf_model, 'models/demand_model.pkl')
print("Demand forecasting model saved.")

# 3. Define RL Environment
class PricingEnv(gym.Env):
    """Custom Environment that follows gym interface"""
    metadata = {'render.modes': ['console']}

    def __init__(self, df, rf_model, scaler):
        super(PricingEnv, self).__init__()
        self.df = df
        self.rf_model = rf_model
        self.scaler = scaler
        
        # Action space: percentage change in price (-20% to +20%) continuous
        self.action_space = spaces.Box(low=-0.2, high=0.2, shape=(1,), dtype=np.float32)
        
        # State: [current_price, competitor_price, day_of_year, base_cost, product_id]
        self.observation_space = spaces.Box(low=0, high=10000, shape=(5,), dtype=np.float32)
        
        self.current_step = 0
        self.max_steps = 365 # 1 year episode
        
        self.product_ids = self.df['product_id'].unique()
        self.reset()

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_step = 0
        
        # Pick a random product
        self.product_id = np.random.choice(self.product_ids)
        product_data = self.df[self.df['product_id'] == self.product_id]
        self.base_cost = product_data['base_cost'].iloc[0]
        
        self.day_of_year = np.random.randint(1, 365)
        self.current_price = self.base_cost * 1.5
        self.competitor_price = self.current_price * np.random.uniform(0.9, 1.1)
        
        return self._get_obs(), {}

    def _get_obs(self):
        return np.array([self.current_price, self.competitor_price, self.day_of_year, self.base_cost, self.product_id], dtype=np.float32)

    def step(self, action):
        # Apply action to current price
        price_change = action[0]
        self.current_price = self.current_price * (1 + price_change)
        
        # Clip price
        self.current_price = np.clip(self.current_price, self.base_cost * 1.01, self.base_cost * 3.0)
        
        # Simulate competitor reaction
        self.competitor_price = self.current_price * np.random.uniform(0.95, 1.05)
        
        # Predict Demand
        obs = self._get_obs()
        obs_scaled = self.scaler.transform([obs])
        predicted_demand = max(0, self.rf_model.predict(obs_scaled)[0])
        
        # Calculate Reward (Profit)
        profit = (self.current_price - self.base_cost) * predicted_demand
        
        self.current_step += 1
        self.day_of_year = (self.day_of_year % 365) + 1
        
        terminated = self.current_step >= self.max_steps
        truncated = False
        
        return self._get_obs(), profit, terminated, truncated, {"demand": predicted_demand, "profit": profit}

# 4. Train RL Agent
print("Training PPO RL Agent...")
env = PricingEnv(df, rf_model, scaler)
rl_model = PPO("MlpPolicy", env, verbose=1, n_steps=1024, batch_size=64)
rl_model.learn(total_timesteps=10000)

rl_model.save("models/ppo_pricing_agent")
print("RL Agent saved to models/ppo_pricing_agent.zip")
