# Dynamic Pricing AI: End-to-End E-Commerce Optimization System

Bu proje, veri madenciliği ve yapay zeka tekniklerini kullanarak bir e-ticaret platformu için dinamik fiyatlandırma stratejileri geliştiren tam kapsamlı bir sistemdir. Sistem, geçmiş satış verilerinden talep tahminleri yapabilen ve kârı maksimize etmek için en uygun fiyatı belirleyen bir yapay zeka ajanına sahiptir.

---

## 1. Proje Mimarisi

Sistem üç ana katmandan oluşmaktadır:

### A. Veri Katmanı (MySQL & Python Data Generator)
- **Veritabanı:** MySQL üzerinde koşan `dynamic_pricing` veritabanı.
- **Veri Üretimi:** `setup_db.py` betiği ile oluşturulan gerçekçi sentetik veriler.
- **Kapsam:** 100 farklı ürün ve bu ürünlerin 2 yıllık (73.000 satır) günlük satış geçmişi.
- **Değişkenler:** Fiyat esnekliği (elasticity), sezonsallık, rakip fiyatları ve maliyet yapıları simüle edilmiştir.

### B. Backend Katmanı (FastAPI & Machine Learning)
- **Sunucu:** Python tabanlı FastAPI (Port 8000).
- **Tahminleme Modeli:** scikit-learn kullanılarak eğitilmiş **Random Forest Regressor**. Fiyat, rakip fiyatı ve zaman değişkenlerine göre "Talep" tahmini yapar.
- **Optimizasyon Modeli:** Stable-Baselines3 kullanılarak eğitilmiş **PPO (Proximal Policy Optimization)** Reinforcement Learning ajanı.
- **RL Ortamı:** Özel olarak yazılmış bir Gymnasium ortamı. Ajan, talep tahmin modelini bir "dünya simülatörü" olarak kullanarak en yüksek kârı getiren fiyat aksiyonlarını öğrenir.

### C. Frontend Katmanı (Next.js & Tailwind CSS)
- **Dashboard:** Modern, 21st.dev estetiğine sahip, Next.js 15 tabanlı arayüz (Port 3000).
- **Temalar:** Dinamik olarak değiştirilebilen Koyu (Dark) ve Açık (Light) mod desteği.
- **Görselleştirme:** Recharts kütüphanesi ile anlık piyasa analizleri, kategori bazlı ciro dağılımları ve global satış trendleri.

---

## 2. Kullanılan Teknolojiler

- **Frontend:** Next.js, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend:** FastAPI, SQLAlchemy, PyMySQL, Uvicorn.
- **AI/ML:** Scikit-learn (Random Forest), Stable-Baselines3 (RL - PPO), Gymnasium, Pandas, NumPy, Joblib.
- **Database:** MySQL.

---

## 3. Yapay Zeka Nasıl Çalışıyor? (Hocaya Anlatım)

Sistemimiz **"Model-in-the-Loop"** prensibiyle çalışır:

1.  **Öğrenme Aşaması:** İlk olarak Random Forest modeli, geçmişteki 73.000 satırı okuyarak fiyat değişimlerinin talebi nasıl etkilediğini (Price Elasticity) öğrenir.
2.  **Simülasyon Aşaması:** Takviyeli Öğrenme (RL) ajanı, bu Random Forest modelini bir "kum havuzu" olarak kullanır. Ajan, fiyatı artırıp azaltarak milyonlarca sanal senaryoyu saniyeler içinde dener.
3.  **Karar Aşaması:** Ajan, kârın en yüksek olduğu (Price vs. Demand dengesi) noktayı bulduğunda bunu "Optimal Price" olarak kullanıcıya önerir.

---

## 4. Kullanım Klavuzu

### Kurulum ve Çalıştırma
1.  **Veritabanı:** MySQL'in yerel olarak çalıştığından emin olun (root:A123ebr123).
2.  **Veri Hazırlama:** `backend/setup_db.py` dosyasını çalıştırarak veritabanını ve sentetik verileri oluşturun.
3.  **Model Eğitimi:** `backend/train_rl.py` dosyasını çalıştırarak AI modellerini eğitin (Modeller `models/` klasörüne kaydedilecektir).
4.  **Backend:** `backend/` klasöründe `uvicorn main:app --port 8000` komutuyla sunucuyu başlatın.
5.  **Frontend:** `frontend/` klasöründe `npm run dev` komutuyla arayüzü başlatın.

### Arayüz Özellikleri
- **Global Overview:** Mağazanın genel performansını, en çok satan ürünleri ve kategori bazlı ciro dağılımını görün.
- **Price Optimizer:** İstediğiniz ürünü katalogdan seçin, "Optimize Price" butonuna basın ve AI'nın sizin için belirlediği yeni fiyat stratejisini tek tıkla uygulayın.
- **Light/Dark Toggle:** Sağ üstteki güneş/ay ikonu ile temayı presentation (sunum) ortamına göre ayarlayın.

---

## 5. Veri Madenciliği Değerlendirmesi

Bu proje; veri ön işleme, sentetik veri üretimi, regresyon analizi ve ileri seviye karar verme algoritmalarını (RL) birleştirdiği için kapsamlı bir veri madenciliği çalışması niteliğindedir. Özellikle "Price Elasticity" ve "Market Competition" gibi ekonomik parametrelerin algoritmik olarak modellenmesi projenin akademik değerini artırmaktadır.

---
**Geliştirici:** Antigravity AI (Data Mining Course Project)
