import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Odalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      await api.put(`/rooms/${roomId}/status?status=${newStatus}`);
      toast.success('Oda durumu güncellendi');
      fetchRooms();
    } catch (error) {
      toast.error('Güncelleme başarısız');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-500/20 text-green-400 border-green-500/30',
      occupied: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      cleaning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      maintenance: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      out_of_order: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || colors.available;
  };

  const getStatusText = (status) => {
    const text = {
      available: 'Müsait',
      occupied: 'Dolu',
      cleaning: 'Temizleniyor',
      maintenance: 'Bakım',
      out_of_order: 'Kullanım Dışı',
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

  return (
    <div data-testid="rooms-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Odalar</h1>
          <p className="text-gray-400">Oda durumlarını yönetin</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {rooms.length === 0 ? (
          <Card className="bg-[#16161a] border-[#2a2a2d] col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Henüz oda bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          rooms.map((room) => (
            <Card key={room.id} data-testid={`room-${room.id}`} className="bg-[#16161a] border-[#2a2a2d] hover:border-amber-500/30 transition-all">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <div className="text-2xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>
                    {room.room_number}
                  </div>
                  <Badge className={`${getStatusColor(room.status)} w-full justify-center`}>
                    {getStatusText(room.status)}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        data-testid={`change-status-${room.id}`}
                        size="sm" 
                        variant="outline" 
                        className="w-full border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23] text-xs"
                      >
                        Durum Değiştir
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#16161a] border-[#2a2a2d] text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Oda {room.room_number} - Durum Değiştir</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'].map(status => (
                          <Button
                            key={status}
                            data-testid={`status-${status}-btn`}
                            onClick={() => updateRoomStatus(room.id, status)}
                            className={`w-full ${room.status === status ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#1f1f23] hover:bg-[#2a2a2d]'} text-white`}
                          >
                            {getStatusText(status)}
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Rooms;
