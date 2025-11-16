import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Calendar, Hotel, Users, BedDouble } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('arrivals');
  const [activeModule, setActiveModule] = useState('reservations');

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
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-green-100 text-green-700 border-green-200',
      checked_in: 'bg-blue-100 text-blue-700 border-blue-200',
      checked_out: 'bg-gray-100 text-gray-700 border-gray-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
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

  // Filter reservations based on active tab
  const getFilteredByTab = () => {
    const today = new Date().toISOString().split('T')[0];
    switch(activeTab) {
      case 'arrivals':
        return reservations.filter(r => r.check_in === today && r.status !== 'cancelled');
      case 'departures':
        return reservations.filter(r => r.check_out === today && r.status === 'checked_in');
      case 'in-house':
        return reservations.filter(r => r.status === 'checked_in');
      default:
        return reservations;
    }
  };

  const filteredByTab = getFilteredByTab();
  const filteredReservations = filterStatus === 'all' 
    ? filteredByTab 
    : filteredByTab.filter(r => r.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const modules = [
    { id: 'reservations', name: 'Reservations', icon: Calendar },
    { id: 'calendar', name: 'Room Calendar', icon: Calendar },
    { id: 'guests', name: 'Guests', icon: Users },
    { id: 'rooms', name: 'Rooms', icon: Hotel },
    { id: 'room-types', name: 'Room Types', icon: BedDouble }
  ];

  return (
    <div data-testid="reservations-page" className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Property Management System</h1>
          <p className="text-lg text-gray-600">Complete hotel operations management</p>
        </div>
        {activeModule === 'reservations' && (
          <Link to="/reservations/new">
            <Button data-testid="new-reservation-btn" className="bg-black hover:bg-gray-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </Link>
        )}
      </div>

      {/* PMS Module Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {modules.map(module => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeModule === module.id
                  ? 'bg-white text-gray-900 border-b-2 border-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {module.name}
            </button>
          );
        })}
      </div>

      {/* Reservations Module */}
      {activeModule === 'reservations' && (
        <div className="space-y-6">
          {/* Arrivals/Departures/In-House Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            {[
              { id: 'arrivals', label: 'Arrivals' },
              { id: 'departures', label: 'Departures' },
              { id: 'in-house', label: 'In-House' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === tab.id
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

          {/* Reservations List */}
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <Card className="bg-white border-gray-200">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">No reservations found for {activeTab}</p>
                </CardContent>
              </Card>
            ) : (
              filteredReservations.map((reservation) => (
                <Card key={reservation.id} data-testid={`reservation-${reservation.id}`} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Reservation #{reservation.id.slice(0, 8)}</h3>
                          <Badge className={`${getStatusColor(reservation.status)}`}>
                            {getStatusText(reservation.status)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">Check-in</p>
                            <p className="text-gray-900 font-semibold">{reservation.check_in}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Check-out</p>
                            <p className="text-gray-900 font-semibold">{reservation.check_out}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Guests</p>
                            <p className="text-gray-900 font-semibold">{reservation.adults} Adults, {reservation.children} Children</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Total Amount</p>
                            <p className="text-gray-900 font-semibold">${reservation.total_amount}</p>
                          </div>
                        </div>
                      </div>
                      <Link to={`/reservations/${reservation.id}`}>
                        <Button data-testid={`view-reservation-${reservation.id}`} className="bg-black hover:bg-gray-800 text-white">
                          View Folio
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Room Calendar Module */}
      {activeModule === 'calendar' && (
        <div>
          <iframe src="/calendar" className="w-full h-[600px] border-0" title="Room Calendar" />
        </div>
      )}

      {/* Guests Module */}
      {activeModule === 'guests' && (
        <div>
          <iframe src="/guests" className="w-full h-[600px] border-0" title="Guests" />
        </div>
      )}

      {/* Rooms Module */}
      {activeModule === 'rooms' && (
        <div>
          <iframe src="/rooms" className="w-full h-[600px] border-0" title="Rooms" />
        </div>
      )}

      {/* Room Types Module */}
      {activeModule === 'room-types' && (
        <div>
          <iframe src="/room-types" className="w-full h-[600px] border-0" title="Room Types" />
        </div>
      )}
    </div>
  );
};

export default Reservations;
