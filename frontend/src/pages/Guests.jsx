import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Mail, Phone, User } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    nationality: '',
    id_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const response = await api.get('/guests');
      setGuests(response.data);
    } catch (error) {
      console.error('Error fetching guests:', error);
      toast.error('Misafirler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/guests', formData);
      toast.success('Misafir başarıyla eklendi!');
      setOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        nationality: '',
        id_number: '',
        notes: ''
      });
      fetchGuests();
    } catch (error) {
      console.error('Error creating guest:', error);
      toast.error('Misafir eklenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div data-testid="guests-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Misafirler</h1>
          <p className="text-gray-400">Misafir bilgilerini yönetin</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-guest-btn" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Misafir
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#16161a] border-[#2a2a2d] text-white">
            <DialogHeader>
              <DialogTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Yeni Misafir Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Ad</Label>
                  <Input
                    data-testid="first-name-input"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Soyad</Label>
                  <Input
                    data-testid="last-name-input"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">E-posta</Label>
                <Input
                  data-testid="email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Telefon</Label>
                <Input
                  data-testid="phone-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-[#2a2a2d] text-gray-400">
                  İptal
                </Button>
                <Button data-testid="submit-guest-btn" type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                  Kaydet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guests.length === 0 ? (
          <Card className="bg-[#16161a] border-[#2a2a2d] col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Henüz misafir bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          guests.map((guest) => (
            <Card key={guest.id} data-testid={`guest-${guest.id}`} className="bg-[#16161a] border-[#2a2a2d] hover:border-amber-500/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {guest.first_name} {guest.last_name}
                    </h3>
                    {guest.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{guest.email}</span>
                      </div>
                    )}
                    {guest.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Guests;
