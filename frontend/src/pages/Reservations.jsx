import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Eye, Calendar as CalendarIcon, Hotel, Users, BedDouble, Mail, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('arrivals');
  const [activeModule, setActiveModule] = useState('reservations');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [newReservationDialog, setNewReservationDialog] = useState(false);
  const [newGuestDialog, setNewGuestDialog] = useState(false);
  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeModule === 'calendar') {
      fetchAvailability();
    }
  }, [activeModule, currentMonth]);

  const fetchAllData = async () => {
    try {
      const [resResponse, guestsRes, roomsRes, roomTypesRes] = await Promise.all([
        api.get('/reservations'),
        api.get('/guests'),
        api.get('/rooms'),
        api.get('/room-types')
      ]);
      setReservations(resResponse.data);
      setGuests(guestsRes.data);
      setRooms(roomsRes.data);
      setRoomTypes(roomTypesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      const response = await api.get(`/calendar/availability?start_date=${startDate}&end_date=${endDate}`);
      setAvailability(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
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

  const handleDateClick = (dateStr, roomTypeData) => {
    setSelectedDate({ date: dateStr, roomType: roomTypeData });
    setNewReservationDialog(true);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const monthName = currentMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const modules = [
    { id: 'reservations', name: 'Reservations', icon: CalendarIcon },
    { id: 'calendar', name: 'Room Calendar', icon: CalendarIcon },
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
        <div className="flex gap-2">
          {activeModule === 'reservations' && (
            <Button onClick={() => setNewReservationDialog(true)} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          )}
          {activeModule === 'guests' && (
            <Button onClick={() => setNewGuestDialog(true)} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Guest
            </Button>
          )}
        </div>
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

          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(status => (
              <Button
                key={status}
                onClick={() => setFilterStatus(status)}
                variant={filterStatus === status ? 'default' : 'outline'}
                className={filterStatus === status ? 'bg-black hover:bg-gray-800 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
              >
                {status === 'all' ? 'All' : getStatusText(status)}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <Card className="bg-white border-gray-200">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">No reservations found for {activeTab}</p>
                </CardContent>
              </Card>
            ) : (
              filteredReservations.map((reservation) => {
                const guest = guests.find(g => g.id === reservation.guest_id);
                return (
                  <Card key={reservation.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                              {guest ? `${guest.first_name} ${guest.last_name}` : 'Guest'}
                            </h3>
                            <Badge className={getStatusColor(reservation.status)}>
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
                          <Button className="bg-black hover:bg-gray-800 text-white">
                            View Folio
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Calendar Module */}
      {activeModule === 'calendar' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button onClick={() => navigateMonth(-1)} variant="outline" className="border-gray-300">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
            <Button onClick={() => navigateMonth(1)} variant="outline" className="border-gray-300">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {availability.map((roomTypeData) => {
              const roomType = roomTypes.find(rt => rt.id === roomTypeData.room_type_id);
              return (
                <Card key={roomTypeData.room_type_id} className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{roomTypeData.room_type_name}</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {roomTypeData.dates.map((dateInfo) => {
                        const date = new Date(dateInfo.date);
                        const isToday = dateInfo.date === new Date().toISOString().split('T')[0];
                        const availabilityPercent = dateInfo.total > 0 ? (dateInfo.available / dateInfo.total) * 100 : 0;
                        
                        let bgColor = 'bg-green-50 border-green-200 hover:bg-green-100';
                        let textColor = 'text-green-700';
                        if (availabilityPercent === 0) {
                          bgColor = 'bg-red-50 border-red-200 hover:bg-red-100';
                          textColor = 'text-red-700';
                        } else if (availabilityPercent < 30) {
                          bgColor = 'bg-orange-50 border-orange-200 hover:bg-orange-100';
                          textColor = 'text-orange-700';
                        } else if (availabilityPercent < 60) {
                          bgColor = 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
                          textColor = 'text-yellow-700';
                        }
                        
                        return (
                          <button
                            key={dateInfo.date}
                            onClick={() => handleDateClick(dateInfo.date, roomTypeData)}
                            className={`p-3 rounded-lg border ${bgColor} ${isToday ? 'ring-2 ring-blue-500' : ''} transition-all cursor-pointer`}
                          >
                            <div className="text-center">
                              <div className="text-sm font-bold text-gray-900 mb-1">
                                {date.getDate()}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                ${dateInfo.rate}
                              </div>
                              <div className={`text-xs font-semibold ${textColor}`}>
                                {dateInfo.available}/{dateInfo.total}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Guests Module */}
      {activeModule === 'guests' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guests.map((guest) => (
            <Card key={guest.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {guest.first_name} {guest.last_name}
                    </h3>
                    {guest.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{guest.email}</span>
                      </div>
                    )}
                    {guest.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rooms Module */}
      {activeModule === 'rooms' && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {room.room_number}
                  </div>
                  <Badge className={`w-full justify-center ${
                    room.status === 'available' ? 'bg-green-100 text-green-700 border-green-200' :
                    room.status === 'occupied' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {room.status === 'available' ? 'Müsait' : room.status === 'occupied' ? 'Dolu' : 'Temizlik'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Room Types Module */}
      {activeModule === 'room-types' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roomTypes.map((type) => (
            <Card key={type.id} className="bg-white border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{type.name}</h3>
                {type.description && <p className="text-gray-600 text-sm mb-4">{type.description}</p>}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Base Price</p>
                    <p className="text-2xl font-bold text-gray-900">${type.base_price}</p>
                    <p className="text-xs text-gray-500">/ night</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Max Guests</p>
                    <p className="text-xl font-bold text-gray-900">{type.max_occupancy}</p>
                  </div>
                </div>
                {type.amenities && type.amenities.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {type.amenities.map((amenity, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reservations;
