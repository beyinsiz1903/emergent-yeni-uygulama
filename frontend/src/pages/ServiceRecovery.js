import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Clock, XCircle, Home } from 'lucide-react';

const ServiceRecovery = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newComplaint, setNewComplaint] = useState({
    guest_id: '',
    booking_id: '',
    category: 'room',
    severity: 'medium',
    description: ''
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await axios.get('/service/complaints');
      setComplaints(response.data.complaints || []);
    } catch (error) {
      toast.error('Şikayetler yüklenemedi');
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/service/complaints', newComplaint);
      toast.success('Şikayet kaydedildi!');
      setShowCreateDialog(false);
      loadComplaints();
      setNewComplaint({
        guest_id: '',
        booking_id: '',
        category: 'room',
        severity: 'medium',
        description: ''
      });
    } catch (error) {
      toast.error('Şikayet kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const SeverityBadge = ({ severity }) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[severity]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-red-50"
          >
            <Home className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🛡️ Service Recovery
            </h1>
            <p className="text-gray-600">
              Şikayet yönetimi ve misafir memnuniyeti
            </p>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-red-600 hover:bg-red-700">
              + Yeni Şikayet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Şikayet Kaydı Oluştur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateComplaint} className="space-y-4 mt-4">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={newComplaint.category}
                  onValueChange={(val) => setNewComplaint({...newComplaint, category: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">Oda</SelectItem>
                    <SelectItem value="service">Hizmet</SelectItem>
                    <SelectItem value="fnb">F&B</SelectItem>
                    <SelectItem value="noise">Gürültü</SelectItem>
                    <SelectItem value="cleanliness">Temizlik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Önem Derecesi</Label>
                <Select
                  value={newComplaint.severity}
                  onValueChange={(val) => setNewComplaint({...newComplaint, severity: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Açıklama *</Label>
                <Textarea
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                  required
                  rows={4}
                  placeholder="Şikayet detaylarını yazın..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Şikayeti Kaydet'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{complaints.filter(c => c.status === 'open').length}</p>
            <p className="text-sm text-gray-500">Açık Şikayet</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{complaints.filter(c => c.status === 'resolved').length}</p>
            <p className="text-sm text-gray-500">Çözüldü</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{complaints.filter(c => c.severity === 'critical').length}</p>
            <p className="text-sm text-gray-500">Kritik</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <XCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{complaints.length}</p>
            <p className="text-sm text-gray-500">Toplam</p>
          </CardContent>
        </Card>
      </div>

      {/* Complaint List */}
      <div className="space-y-4">
        {complaints.map((complaint) => (
          <Card key={complaint.id} className={`border-l-4 ${
            complaint.severity === 'critical' ? 'border-red-500' :
            complaint.severity === 'high' ? 'border-orange-500' :
            complaint.severity === 'medium' ? 'border-yellow-500' :
            'border-blue-500'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold capitalize">{complaint.category}</h3>
                    <SeverityBadge severity={complaint.severity} />
                  </div>
                  <p className="text-gray-700 mb-3">{complaint.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(complaint.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="ml-4">
                  {complaint.status === 'open' ? (
                    <Button size="sm" variant="outline">Çöz</Button>
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServiceRecovery;