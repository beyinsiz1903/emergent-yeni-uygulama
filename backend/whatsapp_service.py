"""
WhatsApp Business Integration
Simplified version - requires WhatsApp Business API credentials
"""
import random
from datetime import datetime

class WhatsAppService:
    """WhatsApp Business service"""
    
    def __init__(self):
        self.mode = "mock"  # mock or production
        # Production needs: WHATSAPP_API_KEY, WHATSAPP_PHONE_NUMBER
    
    async def send_booking_confirmation(self, phone: str, booking_details: dict) -> bool:
        """Rezervasyon onay mesajı gönder"""
        message = f"""
🏨 *Syroce - Rezervasyon Onayı*

Sayın {booking_details['guest_name']},

Rezervasyon numaranız: *{booking_details['booking_id'][:8].upper()}*

📅 Check-in: {booking_details['check_in']}
📅 Check-out: {booking_details['check_out']}
🛏️ Oda: {booking_details['room_type']}
💰 Tutar: €{booking_details['total_amount']}

✅ Online check-in yapabilirsiniz: https://syroce.com/checkin/{booking_details['booking_id']}

Görüşmek üzere!
"""
        
        if self.mode == "production":
            # WhatsApp Business API call
            # Example: requests.post(whatsapp_api_url, ...)
            pass
        else:
            print("\n" + "="*60)
            print("📱 WHATSAPP MESAJI (MOCK)")
            print("="*60)
            print(f"To: {phone}")
            print(f"Message:\n{message}")
            print("="*60 + "\n")
        
        return True
    
    async def send_pre_arrival_message(self, phone: str, guest_name: str, checkin_date: str) -> bool:
        """Pre-arrival mesajı"""
        message = f"""
✨ Merhaba {guest_name}!

Yarın sizi otelimizde ağırlamaktan mutluluk duyacağız.

🎁 *Özel Teklifler:*
- 🛏️ Deluxe Upgrade - Sadece €75
- ⏰ Erken Check-in - Sadece €35
- 💆 Spa Paketi - %20 İndirim

Teklif almak için yanıtlayın!

Syroce Ekibi 🌟
"""
        
        if self.mode == "production":
            # API call
            pass
        else:
            print(f"\n📱 WhatsApp Pre-Arrival to {phone}\n{message}\n")
        
        return True
    
    async def send_upsell_offer(self, phone: str, offer_details: dict) -> bool:
        """Upsell teklifi gönder"""
        message = f"""
💎 *Özel Teklif - Sadece Size!*

{offer_details['title']}

{offer_details['description']}

~~€{offer_details['original_price']}~~ ➡️ *€{offer_details['discounted_price']}*

💚 €{offer_details['savings']} tasarruf!

Kabul etmek için 'EVET' yazın.
"""
        
        if self.mode == "production":
            pass
        else:
            print(f"\n📱 WhatsApp Upsell to {phone}\n{message}\n")
        
        return True

    async def send_loyalty_message(self, phone: str, message: str) -> bool:
        """Generic loyalty automation WhatsApp message"""
        if not phone:
            return False
        formatted_message = f"""
🌟 *Syroce Loyalty Center*

{message}

Syroce Ekibi
"""
        if self.mode == "production":
            # TODO: integrate WhatsApp Business API
            pass
        else:
            print(f"\n📱 WhatsApp Loyalty to {phone}\n{formatted_message}\n")
        return True

# Global instance
whatsapp_service = WhatsAppService()
