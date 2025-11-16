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
    <div data-testid="reservations-page" className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Property Management System</h1>
          <p className="text-lg text-gray-600">Complete hotel operations management</p>
        </div>
        <Link to="/reservations/new">
          <Button data-testid="new-reservation-btn" className="bg-black hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'arrivals', label: 'Arrivals' },
          { id: 'departures', label: 'Departures' },
          { id: 'in-house', label: 'In-House' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium text-sm ${
              tab.id === 'arrivals' 
                ? 'text-gray-900 border-b-2 border-black' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(status => (
          <Button
            key={status}
            data-testid={`filter-${status}`}
            onClick={() => setFilterStatus(status)}
            variant={filterStatus === status ? 'default' : 'outline'}
            className={filterStatus === status ? 'bg-black hover:bg-gray-800 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
          >
            {status === 'all' ? 'All' : getStatusText(status)}
          </Button>
        ))}
      </div>

      {/* Reservations List */}\n      <div className=\"space-y-4\">\n        {filteredReservations.length === 0 ? (\n          <Card className=\"bg-white border-gray-200\">\n            <CardContent className=\"p-12 text-center\">\n              <p className=\"text-gray-500\">No reservations found</p>\n            </CardContent>\n          </Card>\n        ) : (\n          filteredReservations.map((reservation) => (\n            <Card key={reservation.id} data-testid={`reservation-${reservation.id}`} className=\"bg-white border-gray-200 hover:shadow-md transition-shadow\">\n              <CardContent className=\"p-6\">\n                <div className=\"flex items-start justify-between\">\n                  <div className=\"flex-1\">\n                    <div className=\"flex items-center gap-4 mb-4\">\n                      <h3 className=\"text-lg font-bold text-gray-900\">Reservation #{reservation.id.slice(0, 8)}</h3>\n                      <Badge className={`${getStatusColor(reservation.status)}`}>\n                        {getStatusText(reservation.status)}\n                      </Badge>\n                    </div>\n                    <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6 text-sm\">\n                      <div>\n                        <p className=\"text-gray-600 mb-1\">Check-in</p>\n                        <p className=\"text-gray-900 font-semibold\">{reservation.check_in}</p>\n                      </div>\n                      <div>\n                        <p className=\"text-gray-600 mb-1\">Check-out</p>\n                        <p className=\"text-gray-900 font-semibold\">{reservation.check_out}</p>\n                      </div>\n                      <div>\n                        <p className=\"text-gray-600 mb-1\">Guests</p>\n                        <p className=\"text-gray-900 font-semibold\">{reservation.adults} Adults, {reservation.children} Children</p>\n                      </div>\n                      <div>\n                        <p className=\"text-gray-600 mb-1\">Total Amount</p>\n                        <p className=\"text-gray-900 font-semibold\">${reservation.total_amount}</p>\n                      </div>\n                    </div>\n                  </div>\n                  <Link to={`/reservations/${reservation.id}`}>\n                    <Button data-testid={`view-reservation-${reservation.id}`} className=\"bg-black hover:bg-gray-800 text-white\">\n                      View Folio\n                    </Button>\n                  </Link>\n                </div>\n              </CardContent>\n            </Card>\n          ))\n        )}\n      </div>\n    </div>\n  );
};

export default Reservations;
