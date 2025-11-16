import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const NewReservation = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    guest_id: '',
    room_type_id: '',
    check_in: '',
    check_out: '',
    adults: 1,
    children: 0,
    channel: 'direct',
    special_requests: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [guestsRes, roomTypesRes] = await Promise.all([
        api.get('/guests'),
        api.get('/room-types')
      ]);
      setGuests(guestsRes.data);
      setRoomTypes(roomTypesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/reservations', formData);
      toast.success('Rezervasyon başarıyla oluşturuldu!');
      navigate(`/reservations/${response.data.id}`);
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error(error.response?.data?.detail || 'Rezervasyon oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="new-reservation-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => navigate('/reservations')} 
          variant="outline" 
          className="border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23]"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Yeni Rezervasyon</h1>
          <p className="text-gray-400">Yeni rezervasyon oluşturun</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-[#16161a] border-[#2a2a2d]">
          <CardHeader>
            <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Rezervasyon Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-300">Misafir</Label>
                <Select value={formData.guest_id} onValueChange={(value) => setFormData({...formData, guest_id: value})} required>
                  <SelectTrigger data-testid="guest-select" className="bg-[#1f1f23] border-[#2a2a2d] text-white">
                    <SelectValue placeholder="Misafir seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f1f23] border-[#2a2a2d]">
                    {guests.map(guest => (
                      <SelectItem key={guest.id} value={guest.id} className="text-white">
                        {guest.first_name} {guest.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Oda Tipi</Label>
                <Select value={formData.room_type_id} onValueChange={(value) => setFormData({...formData, room_type_id: value})} required>
                  <SelectTrigger data-testid="room-type-select" className="bg-[#1f1f23] border-[#2a2a2d] text-white">
                    <SelectValue placeholder="Oda tipi seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f1f23] border-[#2a2a2d]">
                    {roomTypes.map(type => (
                      <SelectItem key={type.id} value={type.id} className="text-white">
                        {type.name} - ${type.base_price}/gece
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Check-in Tarihi</Label>
                <Input
                  data-testid="check-in-input"
                  type="date"
                  value={formData.check_in}
                  onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Check-out Tarihi</Label>
                <Input
                  data-testid="check-out-input"
                  type="date"
                  value={formData.check_out}
                  onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Yetişkin Sayısı</Label>
                <Input
                  data-testid="adults-input"
                  type="number"
                  min="1"
                  value={formData.adults}
                  onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value)})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Çocuk Sayısı</Label>
                <Input
                  data-testid="children-input"
                  type="number"
                  min="0"
                  value={formData.children}
                  onChange={(e) => setFormData({...formData, children: parseInt(e.target.value)})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-gray-300">Özel İstekler</Label>
                <Textarea
                  data-testid="special-requests-input"
                  value={formData.special_requests}
                  onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => navigate('/reservations')}
                className="border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23]"
              >
                İptal
              </Button>
              <Button 
                data-testid="submit-reservation-btn"
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                {loading ? 'Oluşturuluyor...' : 'Rezervasyon Oluştur'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default NewReservation;
