import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await api.get('/reservations');
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Rezervasyonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
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
      no_show: 'Gelmedi',
    };
    return text[status] || status;
  };

  const filteredReservations = filterStatus === 'all' 
    ? reservations 
    : reservations.filter(r => r.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div data-testid="reservations-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Rezervasyonlar</h1>
          <p className="text-gray-400">Tüm rezervasyonları yönetin</p>
        </div>
        <Link to="/reservations/new">
          <Button data-testid="new-reservation-btn" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Rezervasyon
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(status => (
          <Button
            key={status}
            data-testid={`filter-${status}`}
            onClick={() => setFilterStatus(status)}
            variant={filterStatus === status ? 'default' : 'outline'}
            className={filterStatus === status ? 'bg-amber-500 hover:bg-amber-600' : 'border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23]'}
          >
            {status === 'all' ? 'Tümü' : getStatusText(status)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredReservations.length === 0 ? (
          <Card className="bg-[#16161a] border-[#2a2a2d]">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Henüz rezervasyon bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id} data-testid={`reservation-${reservation.id}`} className="bg-[#16161a] border-[#2a2a2d] hover:border-amber-500/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-white">Rezervasyon #{reservation.id.slice(0, 8)}</h3>
                      <Badge className={`${getStatusColor(reservation.status)}`}>
                        {getStatusText(reservation.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Check-in</p>
                        <p className="text-white font-medium">{reservation.check_in}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Check-out</p>
                        <p className="text-white font-medium">{reservation.check_out}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Misafir Sayısı</p>
                        <p className="text-white font-medium">{reservation.adults} Yetişkin, {reservation.children} Çocuk</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Toplam Tutar</p>
                        <p className="text-white font-medium">${reservation.total_amount}</p>
                      </div>
                    </div>
                  </div>
                  <Link to={`/reservations/${reservation.id}`}>
                    <Button data-testid={`view-reservation-${reservation.id}`} variant="outline" className="border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23]">
                      <Eye className="w-4 h-4 mr-2" />
                      Detay
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Reservations;
