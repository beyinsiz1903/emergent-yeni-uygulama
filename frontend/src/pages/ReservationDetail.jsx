import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, CreditCard, DoorOpen, DoorClosed } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const ReservationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [guest, setGuest] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservationDetails();
  }, [id]);

  const fetchReservationDetails = async () => {
    try {
      const resResponse = await api.get(`/reservations/${id}`);
      setReservation(resResponse.data);

      const guestResponse = await api.get(`/guests/${resResponse.data.guest_id}`);
      setGuest(guestResponse.data);

      const roomResponse = await api.get(`/rooms/${resResponse.data.room_id}`);
      setRoom(roomResponse.data);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Detaylar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.post(`/reservations/${id}/check-in`);
      toast.success('Check-in başarılı!');
      fetchReservationDetails();
    } catch (error) {
      toast.error('Check-in yapılırken hata oluştu');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post(`/reservations/${id}/check-out`);
      toast.success('Check-out başarılı!');
      fetchReservationDetails();
    } catch (error) {
      toast.error('Check-out yapılırken hata oluştu');
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Bu rezervasyonu iptal etmek istediğinizden emin misiniz?')) {
      try {
        await api.post(`/reservations/${id}/cancel`);
        toast.success('Rezervasyon iptal edildi');
        fetchReservationDetails();
      } catch (error) {
        toast.error('İptal işlemi başarısız');
      }
    }
  };

  const handlePayment = async () => {
    try {
      const response = await api.post('/payments/checkout', {
        reservation_id: id,
        origin_url: window.location.origin
      });
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Ödeme başlatılamadı');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
      checked_in: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      checked_out: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status) => {
    const text = {
      pending: 'Beklemede',
      confirmed: 'Onaylandı',
      checked_in: 'Giriş Yapıldı',
      checked_out: 'Çıkış Yapıldı',
      cancelled: 'İptal',
    };
    return text[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!reservation) {
    return <div className="text-white">Rezervasyon bulunamadı</div>;
  }

  return (
    <div data-testid="reservation-detail-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => navigate('/reservations')} 
          variant="outline" 
          className="border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23]"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>
            Rezervasyon Detayı
          </h1>
          <p className="text-gray-400">#{reservation.id.slice(0, 8)}</p>
        </div>
        <Badge className={getStatusColor(reservation.status)}>
          {getStatusText(reservation.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#16161a] border-[#2a2a2d]">
            <CardHeader>
              <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Rezervasyon Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Check-in Tarihi</p>
                  <p className="text-white font-medium">{reservation.check_in}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Check-out Tarihi</p>
                  <p className="text-white font-medium">{reservation.check_out}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Yetişkin</p>
                  <p className="text-white font-medium">{reservation.adults}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Çocuk</p>
                  <p className="text-white font-medium">{reservation.children}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Kanal</p>
                  <p className="text-white font-medium">{reservation.channel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Oda No</p>
                  <p className="text-white font-medium">{room?.room_number}</p>
                </div>
              </div>
              {reservation.special_requests && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Özel İstekler</p>
                  <p className="text-white">{reservation.special_requests}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#16161a] border-[#2a2a2d]">
            <CardHeader>
              <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Misafir Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Ad Soyad</p>
                <p className="text-white font-medium">{guest?.first_name} {guest?.last_name}</p>
              </div>
              {guest?.email && (
                <div>
                  <p className="text-sm text-gray-400">E-posta</p>
                  <p className="text-white font-medium">{guest.email}</p>
                </div>
              )}
              {guest?.phone && (
                <div>
                  <p className="text-sm text-gray-400">Telefon</p>
                  <p className="text-white font-medium">{guest.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#16161a] border-[#2a2a2d]">
            <CardHeader>
              <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Tutar Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Toplam Tutar</p>
                <p className="text-2xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
                  ${reservation.total_amount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Ödenen</p>
                <p className="text-xl font-medium text-green-400">${reservation.paid_amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Kalan</p>
                <p className="text-xl font-medium text-amber-400">
                  ${reservation.total_amount - reservation.paid_amount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#16161a] border-[#2a2a2d]">
            <CardHeader>
              <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reservation.status === 'confirmed' && (
                <Button 
                  data-testid="check-in-button"
                  onClick={handleCheckIn} 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <DoorOpen className="w-4 h-4 mr-2" />
                  Check-in Yap
                </Button>
              )}
              {reservation.status === 'checked_in' && (
                <Button 
                  data-testid="check-out-button"
                  onClick={handleCheckOut} 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <DoorClosed className="w-4 h-4 mr-2" />
                  Check-out Yap
                </Button>
              )}
              {reservation.total_amount > reservation.paid_amount && 
               reservation.status !== 'cancelled' && 
               reservation.status !== 'checked_out' && (
                <Button 
                  data-testid="payment-button"
                  onClick={handlePayment} 
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Ödeme Yap
                </Button>
              )}
              {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                <Button 
                  data-testid="cancel-button"
                  onClick={handleCancel} 
                  variant="outline" 
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rezervasyonu İptal Et
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetail;
