import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const RoomTypes = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: 0,
    max_occupancy: 2,
    amenities: '',
    image_url: ''
  });

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/room-types');
      setRoomTypes(response.data);
    } catch (error) {
      console.error('Error fetching room types:', error);
      toast.error('Oda tipleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArray = formData.amenities.split(',').map(a => a.trim()).filter(a => a);
      await api.post('/room-types', {
        ...formData,
        base_price: parseFloat(formData.base_price),
        max_occupancy: parseInt(formData.max_occupancy),
        amenities: amenitiesArray
      });
      toast.success('Oda tipi başarıyla eklendi!');
      setOpen(false);
      setFormData({
        name: '',
        description: '',
        base_price: 0,
        max_occupancy: 2,
        amenities: '',
        image_url: ''
      });
      fetchRoomTypes();
    } catch (error) {
      console.error('Error creating room type:', error);
      toast.error('Oda tipi eklenirken hata oluştu');
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
    <div data-testid="room-types-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Oda Tipleri</h1>
          <p className="text-gray-400">Oda tiplerini yönetin</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-room-type-btn" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Oda Tipi
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#16161a] border-[#2a2a2d] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Yeni Oda Tipi Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Oda Tipi Adı</Label>
                <Input
                  data-testid="room-type-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                  placeholder="örn: Deluxe Suit"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Açıklama</Label>
                <Textarea
                  data-testid="description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Temel Fiyat ($/gece)</Label>
                  <Input
                    data-testid="base-price-input"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                    className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Maksimum Kişi</Label>
                  <Input
                    data-testid="max-occupancy-input"
                    type="number"
                    value={formData.max_occupancy}
                    onChange={(e) => setFormData({...formData, max_occupancy: e.target.value})}
                    className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Olanaklar (virgülle ayırın)</Label>
                <Input
                  data-testid="amenities-input"
                  value={formData.amenities}
                  onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                  className="bg-[#1f1f23] border-[#2a2a2d] text-white"
                  placeholder="WiFi, Klima, Mini Bar, Deniz Manzarası"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-[#2a2a2d] text-gray-400">
                  İptal
                </Button>
                <Button data-testid="submit-room-type-btn" type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                  Kaydet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomTypes.length === 0 ? (
          <Card className="bg-[#16161a] border-[#2a2a2d] col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Henüz oda tipi bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          roomTypes.map((type) => (
            <Card key={type.id} data-testid={`room-type-${type.id}`} className="bg-[#16161a] border-[#2a2a2d] hover:border-amber-500/30 transition-all">
              <CardHeader>
                <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>{type.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {type.description && (
                  <p className="text-gray-400 text-sm">{type.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Fiyat</p>
                    <p className="text-2xl font-bold text-amber-400" style={{fontFamily: 'Space Grotesk'}}>
                      ${type.base_price}
                    </p>
                    <p className="text-xs text-gray-500">/ gece</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Max {type.max_occupancy} kişi</span>
                    </div>
                  </div>
                </div>
                {type.amenities && type.amenities.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Olanaklar:</p>
                    <div className="flex flex-wrap gap-2">
                      {type.amenities.map((amenity, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-md bg-[#1f1f23] text-gray-300 border border-[#2a2a2d]">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomTypes;
