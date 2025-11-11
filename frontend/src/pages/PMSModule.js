import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BedDouble, Users, Calendar, Plus } from 'lucide-react';

const PMSModule = ({ user, tenant, onLogout }) => {
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(null);

  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_type: 'standard',
    floor: 1,
    capacity: 2,
    base_price: 100,
    amenities: []
  });

  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
    id_number: '',
    address: ''
  });

  const [newBooking, setNewBooking] = useState({
    guest_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    guests_count: 1,
    total_amount: 0,
    channel: 'direct'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roomsRes, guestsRes, bookingsRes] = await Promise.all([
        axios.get('/pms/rooms'),
        axios.get('/pms/guests'),
        axios.get('/pms/bookings')
      ]);
      setRooms(roomsRes.data);
      setGuests(guestsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/pms/rooms', newRoom);
      toast.success('Room created successfully');
      setOpenDialog(null);
      loadData();
      setNewRoom({ room_number: '', room_type: 'standard', floor: 1, capacity: 2, base_price: 100, amenities: [] });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create room');
    }
  };

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/pms/guests', newGuest);
      toast.success('Guest created successfully');
      setOpenDialog(null);
      loadData();
      setNewGuest({ name: '', email: '', phone: '', id_number: '', address: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create guest');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/pms/bookings', newBooking);
      toast.success('Booking created successfully');
      setOpenDialog(null);
      loadData();
      setNewBooking({ guest_id: '', room_id: '', check_in: '', check_out: '', guests_count: 1, total_amount: 0, channel: 'direct' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    }
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      await axios.put(`/pms/rooms/${roomId}`, { status: newStatus });
      toast.success('Room status updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update room status');
    }
  };

  if (loading) {
    return (
      <Layout user={user} tenant={tenant} onLogout={onLogout} currentModule="pms">
        <div className="p-6 text-center">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout user={user} tenant={tenant} onLogout={onLogout} currentModule="pms">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Property Management</h1>
            <p className="text-gray-600">Manage rooms, guests, and bookings</p>
          </div>
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList>
            <TabsTrigger value="rooms" data-testid="tab-rooms">Rooms</TabsTrigger>
            <TabsTrigger value="guests" data-testid="tab-guests">Guests</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Rooms ({rooms.length})</h2>
              <Dialog open={openDialog === 'room'} onOpenChange={(open) => setOpenDialog(open ? 'room' : null)}>
                <DialogTrigger asChild>
                  <Button data-testid="add-room-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Room</DialogTitle>
                    <DialogDescription>Add a new room to your property</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div>
                      <Label htmlFor="room-number">Room Number</Label>
                      <Input
                        id="room-number"
                        data-testid="room-number-input"
                        value={newRoom.room_number}
                        onChange={(e) => setNewRoom({...newRoom, room_number: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="room-type">Room Type</Label>
                      <Select value={newRoom.room_type} onValueChange={(v) => setNewRoom({...newRoom, room_type: v})}>
                        <SelectTrigger id="room-type" data-testid="room-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="deluxe">Deluxe</SelectItem>
                          <SelectItem value="suite">Suite</SelectItem>
                          <SelectItem value="presidential">Presidential</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="floor">Floor</Label>
                        <Input
                          id="floor"
                          type="number"
                          value={newRoom.floor}
                          onChange={(e) => setNewRoom({...newRoom, floor: parseInt(e.target.value)})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={newRoom.capacity}
                          onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value)})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="base-price">Base Price ($)</Label>
                      <Input
                        id="base-price"
                        type="number"
                        step="0.01"
                        value={newRoom.base_price}
                        onChange={(e) => setNewRoom({...newRoom, base_price: parseFloat(e.target.value)})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" data-testid="create-room-btn">Create Room</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room.id} data-testid={`room-card-${room.room_number}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Room {room.room_number}</CardTitle>
                        <CardDescription className="capitalize">{room.room_type}</CardDescription>
                      </div>
                      <BedDouble className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Floor:</span>
                        <span className="font-medium">{room.floor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">{room.capacity} guests</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">${room.base_price}/night</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <Select value={room.status} onValueChange={(v) => updateRoomStatus(room.id, v)}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guests" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Guests ({guests.length})</h2>
              <Dialog open={openDialog === 'guest'} onOpenChange={(open) => setOpenDialog(open ? 'guest' : null)}>
                <DialogTrigger asChild>
                  <Button data-testid="add-guest-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Guest
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Register New Guest</DialogTitle>
                    <DialogDescription>Add guest information</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateGuest} className="space-y-4">
                    <div>
                      <Label htmlFor="guest-name">Name</Label>
                      <Input
                        id="guest-name"
                        data-testid="guest-name-input"
                        value={newGuest.name}
                        onChange={(e) => setNewGuest({...newGuest, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest-email">Email</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        value={newGuest.email}
                        onChange={(e) => setNewGuest({...newGuest, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest-phone">Phone</Label>
                      <Input
                        id="guest-phone"
                        value={newGuest.phone}
                        onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest-id">ID Number</Label>
                      <Input
                        id="guest-id"
                        value={newGuest.id_number}
                        onChange={(e) => setNewGuest({...newGuest, id_number: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest-address">Address</Label>
                      <Input
                        id="guest-address"
                        value={newGuest.address}
                        onChange={(e) => setNewGuest({...newGuest, address: e.target.value})}
                      />
                    </div>
                    <Button type="submit" className="w-full" data-testid="create-guest-btn">Register Guest</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guests.map((guest) => (
                <Card key={guest.id} data-testid={`guest-card-${guest.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{guest.name}</CardTitle>
                        <CardDescription>{guest.email}</CardDescription>
                      </div>
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{guest.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium">{guest.id_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Loyalty Points:</span>
                        <span className="font-medium">{guest.loyalty_points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Stays:</span>
                        <span className="font-medium">{guest.total_stays}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Bookings ({bookings.length})</h2>
              <Dialog open={openDialog === 'booking'} onOpenChange={(open) => setOpenDialog(open ? 'booking' : null)}>
                <DialogTrigger asChild>
                  <Button data-testid="add-booking-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    New Booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Booking</DialogTitle>
                    <DialogDescription>Book a room for a guest</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    <div>
                      <Label htmlFor="booking-guest">Guest</Label>
                      <Select value={newBooking.guest_id} onValueChange={(v) => setNewBooking({...newBooking, guest_id: v})}>
                        <SelectTrigger id="booking-guest" data-testid="booking-guest-select">
                          <SelectValue placeholder="Select guest" />
                        </SelectTrigger>
                        <SelectContent>
                          {guests.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="booking-room">Room</Label>
                      <Select value={newBooking.room_id} onValueChange={(v) => setNewBooking({...newBooking, room_id: v})}>
                        <SelectTrigger id="booking-room" data-testid="booking-room-select">
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.filter(r => r.status === 'available').map(r => (
                            <SelectItem key={r.id} value={r.id}>Room {r.room_number} - {r.room_type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="check-in">Check-in</Label>
                        <Input
                          id="check-in"
                          type="date"
                          value={newBooking.check_in}
                          onChange={(e) => setNewBooking({...newBooking, check_in: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="check-out">Check-out</Label>
                        <Input
                          id="check-out"
                          type="date"
                          value={newBooking.check_out}
                          onChange={(e) => setNewBooking({...newBooking, check_out: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="guests-count">Number of Guests</Label>
                      <Input
                        id="guests-count"
                        type="number"
                        min="1"
                        value={newBooking.guests_count}
                        onChange={(e) => setNewBooking({...newBooking, guests_count: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="total-amount">Total Amount ($)</Label>
                      <Input
                        id="total-amount"
                        type="number"
                        step="0.01"
                        value={newBooking.total_amount}
                        onChange={(e) => setNewBooking({...newBooking, total_amount: parseFloat(e.target.value)})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" data-testid="create-booking-btn">Create Booking</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {bookings.map((booking) => {
                const guest = guests.find(g => g.id === booking.guest_id);
                const room = rooms.find(r => r.id === booking.room_id);
                return (
                  <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <span className="font-semibold text-lg">
                              {guest?.name || 'Unknown Guest'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Room: {room?.room_number || 'N/A'} ({room?.room_type || 'N/A'})</p>
                            <p>Check-in: {new Date(booking.check_in).toLocaleDateString()}</p>
                            <p>Check-out: {new Date(booking.check_out).toLocaleDateString()}</p>
                            <p>Guests: {booking.guests_count}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">${booking.total_amount}</div>
                          <div className="text-sm mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'checked_in' ? 'bg-blue-100 text-blue-700' :
                              booking.status === 'checked_out' ? 'bg-gray-100 text-gray-700' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {booking.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">Channel: {booking.channel}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PMSModule;
