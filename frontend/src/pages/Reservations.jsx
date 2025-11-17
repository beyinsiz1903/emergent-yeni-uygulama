import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Eye, Calendar as CalendarIcon, Hotel, Users, BedDouble, Mail, Phone, ChevronLeft, ChevronRight, X, Building } from 'lucide-react';
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
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);
  const [newReservationDialog, setNewReservationDialog] = useState(false);
  const [reservationDetailsDialog, setReservationDetailsDialog] = useState(false);
  const [selectedReservations, setSelectedReservations] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newGuestDialog, setNewGuestDialog] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [newReservationForm, setNewReservationForm] = useState({
    guest_id: '',
    room_type_id: '',
    check_in: '',
    check_out: '',
    adults: 1,
    children: 0,
    child_ages: [],
    channel: 'direct',
    special_requests: '',
    rate_type: 'standard',
    market_segment: 'direct',
    source: 'website',
    payment_method: 'credit_card',
    deposit_amount: 0,
    auto_invoice: false,
    housekeeping_notes: '',
    eta: '',
    promotion_code: '',
    // Company/Agency
    is_corporate: false,
    company_name: '',
    company_code: '',
    tax_id: '',
    billing_address: '',
    // Rate Override
    base_rate: 0,
    rate_override: 0,
    override_reason: '',
    // Guarantee
    guarantee_status: 'guaranteed',
    guarantee_method: 'credit_card',
    // Cancellation
    cancellation_policy: 'free_cancellation_3_days',
    // Room Preferences
    floor_preference: 'any',
    bed_type: 'any',
    view_preference: 'any',
    smoking: 'non_smoking',
    near_elevator: false,
    // Communication
    communication_preference: 'email',
    marketing_consent: false,
    confirmation_email: ''
  });

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
    // Find reservations for this date and room type
    const dateReservations = reservations.filter(r => {
      const checkIn = new Date(r.check_in);
      const checkOut = new Date(r.check_out);
      const clickedDate = new Date(dateStr);
      return r.room_type_id === roomTypeData.room_type_id &&
             checkIn <= clickedDate &&
             checkOut > clickedDate &&
             r.status !== 'cancelled';
    });

    if (dateReservations.length > 0) {
      // Show existing reservations
      setSelectedReservations(dateReservations);
      setReservationDetailsDialog(true);
    } else {
      // Open new reservation dialog
      setSelectedDateInfo({ date: dateStr, roomType: roomTypeData });
      setNewReservationForm({
        ...newReservationForm,
        room_type_id: roomTypeData.room_type_id,
        check_in: dateStr,
        check_out: dateStr
      });
      setNewReservationDialog(true);
    }
  };

  const handleRoomClick = (room) => {
    // Find current reservation for this room
    const today = new Date().toISOString().split('T')[0];
    const roomReservation = reservations.find(r => 
      r.room_id === room.id && 
      r.status === 'checked_in'
    );

    if (roomReservation) {
      setSelectedReservations([roomReservation]);
      setReservationDetailsDialog(true);
    } else {
      // Open new reservation for this room
      setSelectedRoom(room);
      setNewReservationForm({
        ...newReservationForm,
        room_type_id: room.room_type_id,
        check_in: today
      });
      setNewReservationDialog(true);
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reservations', newReservationForm);
      toast.success('Rezervasyon başarıyla oluşturuldu!');
      setNewReservationDialog(false);
      fetchAllData();
      if (activeModule === 'calendar') {
        fetchAvailability();
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error(error.response?.data?.detail || 'Rezervasyon oluşturulamadı');
    }
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
              return (
                <Card key={roomTypeData.room_type_id} className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{roomTypeData.room_type_name}</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {roomTypeData.dates.map((dateInfo) => {
                        const date = new Date(dateInfo.date);
                        const isToday = dateInfo.date === new Date().toISOString().split('T')[0];
                        const availabilityPercent = dateInfo.total > 0 ? (dateInfo.available / dateInfo.total) * 100 : 0;
                        
                        // Find reservations for this date and room type
                        const dateReservations = reservations.filter(r => {
                          const checkIn = new Date(r.check_in);
                          const checkOut = new Date(r.check_out);
                          const clickedDate = new Date(dateInfo.date);
                          return r.room_type_id === roomTypeData.room_type_id &&
                                 checkIn <= clickedDate &&
                                 checkOut > clickedDate &&
                                 r.status !== 'cancelled';
                        });

                        const hasReservation = dateReservations.length > 0;
                        
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
                            className={`p-2 rounded-lg border ${bgColor} ${isToday ? 'ring-2 ring-blue-500' : ''} transition-all cursor-pointer hover:shadow-md`}
                          >
                            <div className="text-center">
                              <div className="text-sm font-bold text-gray-900 mb-1">
                                {date.getDate()}
                              </div>
                              {hasReservation && dateReservations[0] && (
                                <div className="mb-1">
                                  {dateReservations.slice(0, 2).map((res) => {
                                    const guest = guests.find(g => g.id === res.guest_id);
                                    return (
                                      <div key={res.id} className="text-[10px] leading-tight mb-1">
                                        <div className="font-semibold text-gray-900 truncate">
                                          {guest ? `${guest.first_name} ${guest.last_name}` : 'Guest'}
                                        </div>
                                        <div className="text-gray-600 flex items-center gap-1 justify-center">
                                          <Building className="w-2 h-2" />
                                          <span>{res.channel}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {dateReservations.length > 2 && (
                                    <div className="text-[10px] text-gray-600">+{dateReservations.length - 2} more</div>
                                  )}
                                </div>
                              )}
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
          {rooms.map((room) => {
            const roomReservation = reservations.find(r => r.room_id === room.id && r.status === 'checked_in');
            const guest = roomReservation ? guests.find(g => g.id === roomReservation.guest_id) : null;
            
            return (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className="text-left"
              >
                <Card className="bg-white border-gray-200 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {room.room_number}
                      </div>
                      {guest && (
                        <div className="mb-2 text-xs">
                          <div className="font-semibold text-gray-900">
                            {guest.first_name} {guest.last_name}
                          </div>
                          <div className="text-gray-600 flex items-center gap-1 justify-center">
                            <Building className="w-3 h-3" />
                            <span>{roomReservation.channel}</span>
                          </div>
                        </div>
                      )}
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
              </button>
            );
          })}
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

      {/* Reservation Details Dialog */}
      <Dialog open={reservationDetailsDialog} onOpenChange={setReservationDetailsDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reservation Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReservations.map((reservation) => {
              const guest = guests.find(g => g.id === reservation.guest_id);
              const room = rooms.find(r => r.id === reservation.room_id);
              const roomType = roomTypes.find(rt => rt.id === reservation.room_type_id);
              
              return (
                <Card key={reservation.id} className="bg-gray-50 border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {guest ? `${guest.first_name} ${guest.last_name}` : 'Guest'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="w-4 h-4" />
                          <span>{reservation.channel}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(reservation.status)}>
                        {getStatusText(reservation.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Room</p>
                        <p className="font-semibold text-gray-900">
                          {room?.room_number} - {roomType?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Guests</p>
                        <p className="font-semibold text-gray-900">
                          {reservation.adults} Adults, {reservation.children} Children
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check-in</p>
                        <p className="font-semibold text-gray-900">{reservation.check_in}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check-out</p>
                        <p className="font-semibold text-gray-900">{reservation.check_out}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-semibold text-gray-900">${reservation.total_amount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Contact</p>
                        <p className="font-semibold text-gray-900">{guest?.phone || guest?.email || '-'}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                      <Link to={`/reservations/${reservation.id}`} className="flex-1">
                        <Button className="w-full bg-black hover:bg-gray-800 text-white">
                          View Full Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Reservation Dialog */}
      <Dialog open={newReservationDialog} onOpenChange={setNewReservationDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-xl">Create New Reservation</DialogTitle>
            <p className="text-sm text-gray-600">Complete reservation details for hotel operations</p>
          </DialogHeader>
          <form onSubmit={handleCreateReservation} className="space-y-6">
            {/* Guest & Room Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Guest & Room Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Guest *</Label>
                  <Select value={newReservationForm.guest_id} onValueChange={(value) => setNewReservationForm({...newReservationForm, guest_id: value})} required>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Select guest" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {guests.map(guest => (
                        <SelectItem key={guest.id} value={guest.id}>
                          {guest.first_name} {guest.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Room Type *</Label>
                  <Select value={newReservationForm.room_type_id} onValueChange={(value) => setNewReservationForm({...newReservationForm, room_type_id: value})} required>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {roomTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} - ${type.base_price}/night
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Check-in Date *</Label>
                  <Input
                    type="date"
                    value={newReservationForm.check_in}
                    onChange={(e) => setNewReservationForm({...newReservationForm, check_in: e.target.value})}
                    className="bg-white border-gray-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Check-out Date *</Label>
                  <Input
                    type="date"
                    value={newReservationForm.check_out}
                    onChange={(e) => setNewReservationForm({...newReservationForm, check_out: e.target.value})}
                    className="bg-white border-gray-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Adults *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newReservationForm.adults}
                    onChange={(e) => setNewReservationForm({...newReservationForm, adults: parseInt(e.target.value)})}
                    className="bg-white border-gray-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Children</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newReservationForm.children}
                    onChange={(e) => setNewReservationForm({...newReservationForm, children: parseInt(e.target.value)})}
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Estimated Arrival Time</Label>
                  <Input
                    type="time"
                    value={newReservationForm.eta}
                    onChange={(e) => setNewReservationForm({...newReservationForm, eta: e.target.value})}
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Revenue & Sales Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Revenue & Sales Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Rate Type *</Label>
                  <Select value={newReservationForm.rate_type} onValueChange={(value) => setNewReservationForm({...newReservationForm, rate_type: value})} required>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="standard">Standard Rate</SelectItem>
                      <SelectItem value="non_refundable">Non-Refundable</SelectItem>
                      <SelectItem value="breakfast">Breakfast Included</SelectItem>
                      <SelectItem value="half_board">Half Board</SelectItem>
                      <SelectItem value="full_board">Full Board</SelectItem>
                      <SelectItem value="ota_rate">OTA Rate</SelectItem>
                      <SelectItem value="corporate">Corporate Rate</SelectItem>
                      <SelectItem value="government">Government Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Market Segment *</Label>
                  <Select value={newReservationForm.market_segment} onValueChange={(value) => setNewReservationForm({...newReservationForm, market_segment: value})} required>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="ota">OTA (Online Travel Agency)</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="agency">Travel Agency</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="leisure">Leisure</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Source of Reservation *</Label>
                  <Select value={newReservationForm.source} onValueChange={(value) => setNewReservationForm({...newReservationForm, source: value})} required>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="booking_com">Booking.com</SelectItem>
                      <SelectItem value="expedia">Expedia</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="agoda">Agoda</SelectItem>
                      <SelectItem value="hotels_com">Hotels.com</SelectItem>
                      <SelectItem value="other_ota">Other OTA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Promotion Code</Label>
                  <Input
                    type="text"
                    value={newReservationForm.promotion_code}
                    onChange={(e) => setNewReservationForm({...newReservationForm, promotion_code: e.target.value})}
                    className="bg-white border-gray-300"
                    placeholder="SUMMER2025"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Payment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Payment Method *</Label>
                  <Select value={newReservationForm.payment_method} onValueChange={(value) => setNewReservationForm({...newReservationForm, payment_method: value})} required>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="pos">POS Terminal</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="virtual_card">Virtual Card</SelectItem>
                      <SelectItem value="ota_collect">OTA Collect</SelectItem>
                      <SelectItem value="invoice">Company Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Deposit / Prepayment Amount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newReservationForm.deposit_amount}
                    onChange={(e) => setNewReservationForm({...newReservationForm, deposit_amount: parseFloat(e.target.value)})}
                    className="bg-white border-gray-300"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="auto_invoice"
                      checked={newReservationForm.auto_invoice}
                      onChange={(e) => setNewReservationForm({...newReservationForm, auto_invoice: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="auto_invoice" className="text-gray-700 cursor-pointer">
                      Auto-generate invoice upon check-out
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Notes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Operational Notes</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Housekeeping Notes</Label>
                  <Textarea
                    value={newReservationForm.housekeeping_notes}
                    onChange={(e) => setNewReservationForm({...newReservationForm, housekeeping_notes: e.target.value})}
                    className="bg-white border-gray-300"
                    rows={3}
                    placeholder="Extra bed, crib, low pillow, VIP setup, allergies, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Guest Special Requests</Label>
                  <Textarea
                    value={newReservationForm.special_requests}
                    onChange={(e) => setNewReservationForm({...newReservationForm, special_requests: e.target.value})}
                    className="bg-white border-gray-300"
                    rows={3}
                    placeholder="Late check-out, airport pickup, dietary requirements, etc."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setNewReservationDialog(false)} className="flex-1 border-gray-300">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-black hover:bg-gray-800 text-white">
                Create Reservation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reservations;
