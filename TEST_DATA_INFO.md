# Test Verileri Bilgilendirme

## 📊 Oluşturulan Test Verileri

### Test Kullanıcısı: test@test.com

**Veri Kapsamı:** Son 2 yıl + önümüzdeki 3 ay

#### 🛏️ Oteller Bilgileri
- **Toplam Oda:** 85 oda
- **Oda Tipleri:**
  - Standard Single: 20 oda (₺150/gece)
  - Standard Double: 30 oda (₺200/gece)
  - Deluxe Double: 15 oda (₺280/gece)
  - Suite: 10 oda (₺400/gece)
  - Family Room: 8 oda (₺350/gece)
  - Presidential Suite: 2 oda (₺800/gece)

#### 👥 Misafir Verileri
- **Toplam Misafir:** 500 unique guest
- **Uyruklar:** Türk, Amerikan, Alman, İngiliz, Fransız, İtalyan, İspanyol, Rus
- **Misafir Tipleri:** Leisure, Business, Group
- **VIP Misafirler:** ~20% (rastgele seçilmiş)

#### 📅 Rezervasyon Verileri
- **Toplam Rezervasyon:** 47,015 rezervasyon
- **Tarih Aralığı:** Kasım 2023 - Şubat 2026
- **Mevsimsel Doluluk:**
  - Yaz Sezonu (Haziran-Ağustos): %85 doluluk
  - Kış Tatilleri (Aralık-Ocak): %75 doluluk
  - Ara Sezon (Nisan-Mayıs, Eylül-Ekim): %65 doluluk
  - Düşük Sezon: %50 doluluk

#### 💰 Finansal Veriler
- **Toplam Gelir:** $57,103,094.77
  - Oda gelirleri
  - F&B gelirleri
  - Minibar, Spa, Laundry vb.
- **Toplam Gider:** $1,852,729.60
  - Maaşlar (aylık ~₺50,000)
  - Utilities (aylık ~₺10,000)
  - Malzemeler (aylık ~₺6,500)
  - Bakım (aylık ~₺5,000)
  - Pazarlama (aylık ~₺6,000)
- **Net Kar:** $55,250,365.17
- **Kar Marjı:** %96.76

#### 📄 Folio Verileri
- **Toplam Folio:** 35,774 folio
- **Gelir Kalemleri:** 255,403 charge
- **Ödemeler:** 35,567 payment
- **Ödeme Yöntemleri:** Kredi kartı, Nakit, Banka transferi

#### ⭐ Değerlendirmeler
- **Toplam Review:** 21,417 değerlendirme
- **Review Oranı:** %60 (checked-out rezervasyonlardan)
- **Ortalama Rating:** 4-5 yıldız ağırlıklı
- **Kaynaklar:** Google, TripAdvisor, Booking.com, Direct

#### 🍽️ F&B Verileri
- **Toplam POS Sipariş:** 37,331 sipariş
- **Kategoriler:**
  - Yiyecek: Steak, Pasta, Salad, Dessert
  - İçecek: Wine, Beer, Coffee
- **Ortalama Sipariş:** 1-4 ürün/sipariş
- **Toplam Masalar:** 30 masa

#### 📊 Bütçe Verileri
- **Dönem:** Son 12 ay
- **Aylık Gelir Bütçesi:** ₺180,000 - ₺220,000
- **Aylık Gider Bütçesi:** ₺120,000 - ₺150,000
- **Doluluk Hedefi:** %70-85
- **ADR Hedefi:** ₺180-220

### Reservation Status Dağılımı
- **Checked Out:** %85 (geçmiş rezervasyonlar)
- **Cancelled:** %12
- **No-Show:** %3
- **Checked In:** Mevcut aktif rezervasyonlar
- **Confirmed/Guaranteed:** Gelecek rezervasyonlar

### Booking Sources
- **Direct:** Doğrudan rezervasyonlar
- **OTA:** Booking.com, Expedia, Hotels.com, Agoda, Airbnb
  - Komisyon: %15-25
- **Corporate:** Kurumsal anlaşmalar
- **Walk-in:** Kapıdan gelen misafirler
- **Agent:** Seyahat acenteleri

### Market Segments
- Corporate (Kurumsal)
- Leisure (Tatil)
- Group (Grup)
- MICE (Toplantı/Etkinlik)
- Government (Devlet)
- Wholesale (Toptan)

## 🎯 Test Senaryoları

### 1. Revenue Dashboard Test
```bash
# Login
Email: test@test.com
Password: test123

# Navigate to
/mobile/revenue

# Test edilebilecekler:
- Son 7/30/60/90 günlük ADR ve RevPAR
- Toplam gelir dağılımı (oda, F&B, diğer)
- Segment analizi (corporate, leisure, group)
- Kanal performansı (OTA, direct, corporate)
- Pickup grafiği (rezervasyon hızı)
- 30 günlük forecast
- İptal ve no-show oranları
```

### 2. F&B Dashboard Test
```bash
# Login
Email: test@test.com
Password: test123

# Test API endpoints:
GET /api/fnb/dashboard?date=2025-01-15
GET /api/fnb/sales-report?start_date=2025-01-01&end_date=2025-01-31
GET /api/fnb/menu-performance
GET /api/fnb/revenue-chart?period=30days

# Test edilebilecekler:
- Günlük F&B satışları
- Yiyecek vs içecek oranı
- En çok satan menü ürünleri
- Masa devir hızı
- Günlük gelir trendleri
```

### 3. Dashboard KPIs Test
```bash
# Test API endpoints:
GET /api/dashboard/revenue-expense-chart?period=30days
GET /api/dashboard/budget-vs-actual?month=2025-01
GET /api/dashboard/monthly-profitability?months=6
GET /api/dashboard/trend-kpis?period=7days

# Test edilebilecekler:
- Gelir-gider grafiği (3 farklı periyot)
- Bütçe vs gerçekleşen karşılaştırması
- 6 aylık kârlılık trendi
- KPI trendleri (Revenue, Bookings, Occupancy, ADR, RevPAR, Rating)
```

### 4. Occupancy Analysis
```bash
# Test bookings by date range
GET /api/bookings?start_date=2024-06-01&end_date=2024-08-31

# Yaz sezonu doluluk analizi
# Mevsimsel trendleri gözlemle
# Kapasite kullanım oranları
```

### 5. Guest Review Analysis
```bash
# Test reviews
GET /api/reviews?start_date=2024-01-01&end_date=2024-12-31

# 21,000+ değerlendirme
# Ortalama rating hesaplama
# Kaynak bazlı analiz
# Sentiment analizi için hazır veri
```

## 📈 Veri Kalitesi

### Gerçekçi Özellikler
✅ Mevsimsel doluluk varyasyonları
✅ Gerçekçi fiyat dağılımları
✅ Tutarlı rezervasyon süreleri (1-21 gün)
✅ OTA komisyon oranları (%15-25)
✅ Gerçekçi iptal oranları (%12)
✅ No-show oranları (%3)
✅ Review rate %60
✅ Aylık gider kalemleri
✅ Bütçe-gerçekleşen varyansları

### Veri Bütünlüğü
✅ Her booking için folio
✅ Her folio için charges
✅ Her checked-out booking için payment
✅ Geçmiş veriler için reviews
✅ F&B charges için POS orders
✅ Tutarlı tarih sıraları
✅ Tenant isolation

## 🔄 Veri Yenileme

### Tüm Test Verilerini Silme
```bash
python3 << 'EOF'
import pymongo
from pymongo import MongoClient
import os

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = MongoClient(mongo_url)
db = client['hotel_pms']

test_user = db.users.find_one({'email': 'test@test.com'})
tenant_id = test_user['tenant_id']

collections = [
    'rooms', 'guests', 'bookings', 'folio_charges', 'payments',
    'expenses', 'reviews', 'pos_orders', 'budgets', 'folios'
]

for coll in collections:
    result = db[coll].delete_many({'tenant_id': tenant_id})
    print(f"Deleted {result.deleted_count} from {coll}")
EOF
```

### Yeni Test Verileri Oluşturma
```bash
cd /app
python3 populate_test_data.py
```

## 🎨 Özelleştirilmiş Veri Oluşturma

Script'i düzenleyerek:
- Oda sayısını değiştirin (`room_types` listesi)
- Misafir sayısını artırın/azaltın (`range(500)`)
- Tarih aralığını değiştirin (`start_date`, `end_date`)
- Doluluk oranlarını ayarlayın (`daily_occupancy_target`)
- Fiyat aralıklarını değiştirin (`rate_variation`)

## ⚠️ Önemli Notlar

1. **Performance:** 47,000+ rezervasyon ve 255,000+ charge büyük veri setidir. Bazı sorgular yavaş olabilir.

2. **Memory:** MongoDB için yeterli memory'nin ayrıldığından emin olun.

3. **İndeksler:** Production'da şu indeksleri ekleyin:
   ```javascript
   db.bookings.createIndex({"tenant_id": 1, "check_in": 1})
   db.folio_charges.createIndex({"tenant_id": 1, "date": 1})
   db.reviews.createIndex({"tenant_id": 1, "rating": 1})
   ```

4. **Backup:** Test verileri oluşturmadan önce mevcut verilerin backup'ını alın.

5. **Production:** Bu script sadece test amaçlıdır, production'da kullanmayın.

## 🚀 Hızlı Başlangıç

```bash
# 1. Test kullanıcısı ile login
Email: test@test.com
Password: test123

# 2. Revenue dashboard'a git
/mobile/revenue

# 3. Farklı periyotları test et
- Son 7 gün
- Son 30 gün
- Son 90 gün

# 4. Tüm görünümleri kontrol et
- Genel (Overview)
- Segment Dağılımı
- Kanal Dağılımı
- Pickup Grafiği
- Forecast
- İptal Raporları

# 5. F&B modülünü test et
/mobile/fnb

# 6. Dashboard KPI'ları kontrol et
API endpoint'lerini Postman/cURL ile test et
```

---
**Son Güncelleme:** 2025-01-23
**Veri Versiyonu:** 1.0
**Toplam Kayıt:** 430,000+
**Durum:** ✅ Aktif ve Kullanılabilir
