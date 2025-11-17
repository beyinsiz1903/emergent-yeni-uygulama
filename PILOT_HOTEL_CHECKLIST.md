# 🏨 PILOT HOTEL KURULUM CHECKLIST

## 📋 ÖN HAZIRLIK (Demo Öncesi)

### Bilgi Toplama
- [ ] Otel adı ve adresi
- [ ] Yönetici adı ve iletişim bilgileri
- [ ] Toplam oda sayısı
- [ ] Oda tipleri ve fiyatları
- [ ] Mevcut kullandıkları sistem (varsa)
- [ ] Entegre olmak istedikleri OTA'lar
- [ ] Kurumsal müşterileri (varsa)

---

## 🚀 1. AŞAMA: HESAP OLUŞTURMA (15 dakika)

### Tenant Registration
```python
POST /api/auth/register
{
  "property_name": "[HOTEL ADI]",
  "email": "[HOTEL EMAIL]",
  "password": "[GÜVENLİ ŞİFRE]",
  "name": "[YÖNETİCİ ADI]",
  "phone": "[TELEFON]",
  "address": "[ADRES]"
}
```

**Checklist:**
- [ ] Hesap oluşturuldu
- [ ] Login testi yapıldı
- [ ] Şifre ve email müşteriye iletildi

---

## 🏨 2. AŞAMA: PROPERTY SETUP (30-45 dakika)

### A. Oda Tanımları
Tüm odaları sisteme kaydedin:

**Her oda için:**
- [ ] Oda numarası
- [ ] Oda tipi (standard/deluxe/suite vb.)
- [ ] Kat bilgisi
- [ ] Kapasite (kişi sayısı)
- [ ] Base price (temel fiyat)
- [ ] Amenities (olanaklar: wifi, tv, minibar, vb.)

**Örnek:**
```json
{
  "room_number": "101",
  "room_type": "standard",
  "floor": 1,
  "capacity": 2,
  "base_price": 100.00,
  "amenities": ["wifi", "tv", "minibar"]
}
```

**İstatistik:**
- [ ] Toplam ____ oda kaydedildi
- [ ] Tüm oda tipleri temsil ediliyor

### B. Kurumsal Şirketler (Varsa)
Kurumsal anlaşmalı şirketleri ekleyin:

**Her şirket için:**
- [ ] Şirket adı
- [ ] Kurumsal kod
- [ ] Vergi numarası
- [ ] Fatura adresi
- [ ] İletişim kişisi ve bilgileri
- [ ] Anlaşmalı fiyat
- [ ] Ödeme koşulları (Net 30/45/60)

---

## 👥 3. AŞAMA: STAFF SETUP (15 dakika)

### Kullanıcı Rolleri
- [ ] Admin (GM/Owner)
- [ ] Front Desk Staff
- [ ] Housekeeping Manager
- [ ] Finance/Accounting

**Her kullanıcı için:**
- [ ] Ad-soyad
- [ ] Email
- [ ] Telefon
- [ ] Rol tanımı
- [ ] İlk giriş şifresi verildi

---

## 💻 4. AŞAMA: ENTEGRASYONLAR (30-60 dakika)

### A. OTA Channel Manager
Mevcut OTA bağlantılarını kurun:

**Booking.com:**
- [ ] Property ID alındı
- [ ] API credentials alındı
- [ ] Test connection başarılı
- [ ] İlk rezervasyon sync testi yapıldı

**Expedia:**
- [ ] Property ID alındı
- [ ] API credentials alındı
- [ ] Test connection başarılı
- [ ] İlk rezervasyon sync testi yapıldı

**Airbnb (Opsiyonel):**
- [ ] Listing ID alındı
- [ ] API credentials alındı
- [ ] Test connection başarılı

### B. Payment Gateway (Gelecek Feature)
- [ ] Payment provider seçildi
- [ ] API credentials hazırlandı
- [ ] Test transaction yapıldı

---

## 📊 5. AŞAMA: DATA MIGRATION (Varsa - 1-2 saat)

### Mevcut Sistem Datası
Eğer başka sistemden geçiş varsa:

**Misafir Kayıtları:**
- [ ] Excel/CSV formatına çevirme
- [ ] Data cleaning (telefon, email formatları)
- [ ] Bulk import scripti hazırlama
- [ ] Test import
- [ ] Production import

**Aktif Rezervasyonlar:**
- [ ] Gelecek rezervasyonları listeleme
- [ ] Formata uygun hale getirme
- [ ] Import ve test
- [ ] Oda atamalarının kontrolü

**Folio Balances:**
- [ ] Açık hesaplar listeleme
- [ ] Manuel folio oluşturma
- [ ] Balance transferi

---

## 🎓 6. AŞAMA: STAFF TRAINING (2-3 saat)

### A. Front Desk Eğitimi (1 saat)
**Konu Başlıkları:**
- [ ] Login ve dashboard navigasyonu
- [ ] Yeni rezervasyon oluşturma
- [ ] Rezervasyon arama ve düzenleme
- [ ] Check-in işlemi
  - [ ] Oda durumu kontrolü
  - [ ] Misafir bilgileri doğrulama
  - [ ] Folio oluşturma
- [ ] Check-out işlemi
  - [ ] Folio kapatma
  - [ ] Ödeme alma
  - [ ] Balance kontrolü

**Pratik Alıştırmalar:**
- [ ] 3 check-in senaryosu
- [ ] 2 check-out senaryosu
- [ ] 1 rezervasyon düzenleme

### B. Housekeeping Eğitimi (30 dakika)
**Konu Başlıkları:**
- [ ] Housekeeping board görünümü
- [ ] Oda durumu güncelleme
  - [ ] Dirty → Cleaning
  - [ ] Cleaning → Inspected
  - [ ] Inspected → Available
- [ ] Due-out ve stayover listelerini görüntüleme
- [ ] Task assignment

### C. Finance/Accounting Eğitimi (45 dakika)
**Konu Başlıkları:**
- [ ] Folio management
  - [ ] Charge posting
  - [ ] Payment posting
  - [ ] Void charges
  - [ ] Transfer charges
- [ ] Invoice generation
  - [ ] Turkish tax system (KDV, ÖTV, Tevkifat)
  - [ ] Export options
- [ ] Reports
  - [ ] Daily Flash
  - [ ] Market Segment
  - [ ] Company Aging

### D. Management Eğitimi (45 dakika)
**Konu Başlıkları:**
- [ ] GM Dashboard KPI'ları
  - [ ] Occupancy
  - [ ] ADR, RevPAR
  - [ ] Revenue breakdown
- [ ] RMS (Revenue Management)
  - [ ] Pricing suggestions görüntüleme
  - [ ] Suggestion apply/reject
  - [ ] Manual rate overrides
- [ ] Reporting and analytics
- [ ] User and role management
- [ ] Audit logs

---

## ✅ 7. AŞAMA: GO-LIVE CHECKLIST (Son Kontroller)

### Pre-Launch (1 hafta önce)
- [ ] Tüm odalar sistemde
- [ ] Staff eğitimleri tamamlandı
- [ ] Aktif rezervasyonlar transfer edildi
- [ ] OTA entegrasyonları test edildi
- [ ] Dummy check-in/check-out testleri yapıldı

### Launch Day
- [ ] Sabah briefing yapıldı
- [ ] Support line aktif
- [ ] Backup plan hazır
- [ ] İlk rezervasyon kontrolü
- [ ] İlk check-in/check-out kontrolü

### Post-Launch (İlk 3 gün)
**Gün 1:**
- [ ] Sabah toplantısı: Sorunlar değerlendir
- [ ] Tüm işlemler izleniyor
- [ ] Staff feedback toplanıyor

**Gün 2:**
- [ ] Devam eden sorunlar çözüldü
- [ ] Mini refresher training (gerekirse)
- [ ] System performance monitoring

**Gün 3:**
- [ ] Rutin operasyon başladı
- [ ] İlk hafta raporu hazırlanıyor
- [ ] Improvement feedback alınıyor

---

## 📞 8. AŞAMA: SUPPORT SETUP

### İletişim Kanalları
- [ ] Support email: support@roomops.com
- [ ] Support phone/WhatsApp: [NUMARA]
- [ ] Emergency contact: [NUMARA]

### Support Saatleri
- [ ] Hafta içi: 09:00 - 18:00
- [ ] Acil durumlar: 7/24

### Documentation
- [ ] User manual paylaşıldı
- [ ] Video tutorials linki verildi
- [ ] FAQ document hazırlandı

---

## 📈 9. AŞAMA: SUCCESS METRICS (İlk Ay)

### Kullanım Metrikleri
- [ ] Daily active users
- [ ] Rezervasyon sayısı
- [ ] Check-in/check-out sayısı
- [ ] Folio işlem sayısı

### Operasyonel Metrikler
- [ ] Average check-in time azaldı mı?
- [ ] Folio accuracy iyileşti mi?
- [ ] OTA sync hataları minimal mi?
- [ ] Staff satisfaction score

### Finansal Metrikler
- [ ] ADR trendi
- [ ] Occupancy oranı
- [ ] RevPAR artışı
- [ ] Manual error reduction

---

## 🎯 10. PHASE-OUT (Eski Sistem Kapatma)

### Paralel Çalışma (2 hafta)
- [ ] Her iki sistemde de data girişi
- [ ] Cross-check yapılıyor
- [ ] Farklılıklar analiz ediliyor

### Geçiş Onayı
- [ ] Tüm stakeholder'lar onay verdi
- [ ] Son backup alındı
- [ ] Migration raporu hazırlandı

### Eski Sistem Kapatma
- [ ] Eski sistem read-only yapıldı
- [ ] Archive data export edildi
- [ ] Subscription iptal edildi

---

## 🏆 SUCCESS CRITERIA

Pilot başarılı sayılır eğer:
- ✅ 95%+ uptime
- ✅ Staff adoption rate >90%
- ✅ Zero critical bugs
- ✅ Positive customer feedback
- ✅ Measurable efficiency improvement
- ✅ Hotel recommendation letter

---

## 📋 CONTACT INFORMATION

**RoomOps Support Team**
- Email: support@roomops.com
- Phone: +90-XXX-XXX-XXXX
- Emergency: +90-XXX-XXX-XXXX (24/7)

**Implementation Lead:** [İSİM]
- Email: [EMAIL]
- Phone: [TELEFON]

---

**💡 Not:** Bu checklist her pilot hotel için özelleştirilebilir. Otel büyüklüğü ve kompleksliği göre timeline ayarlanmalıdır.
