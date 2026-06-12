@echo off
echo =======================================
echo Proje Kurulumuna Hos Geldiniz!
echo Bu islem birkac dakika surebilir...
echo =======================================

echo.
echo [1/2] Frontend bagimliliklari yukleniyor (Node.js)...
cd frontend
call npm install
cd ..
echo Frontend kurulumu tamamlandi!

echo.
echo [2/2] Backend bagimliliklari yukleniyor (Python)...
cd backend

if not exist venv (
    echo Python sanal ortami (venv) olusturuluyor...
    python -m venv venv
)

echo Bagimliliklar kuruluyor...
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..
echo Backend kurulumu tamamlandi!

echo.
echo =======================================
echo Kurulum Basariyla Tamamlandi!
echo =======================================
pause
