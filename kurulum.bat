@echo off
echo =======================================
echo Dynamic Pricing AI - Project Setup
echo This process may take a few minutes...
echo =======================================

echo.
echo [1/2] Installing Frontend dependencies (Node.js)...
cd frontend
call npm install
cd ..
echo Frontend installation completed!

echo.
echo [2/2] Installing Backend dependencies (Python)...
cd backend

if not exist venv (
    echo Creating Python virtual environment (venv)...
    python -m venv venv
)

echo Installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..
echo Backend installation completed!

echo.
echo =======================================
echo Setup Successfully Completed!
echo =======================================
pause
