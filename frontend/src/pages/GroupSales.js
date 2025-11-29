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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, DollarSign, Calendar, Mail, Phone, Home, Activity, PieChart, Loader2 } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const colors = {
    tentative: 'bg-yellow-100 text-yellow-800',
    definite: 'bg-green-100 text-green-800',
    released: 'bg-gray-100 text-gray-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const labels = {
    tentative: 'Opsiyonel',
    definite: 'Kesin',
    released: 'Serbest Bırakıldı',
    completed: 'Tamamlandı',
    cancelled: 'İptal'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
};

const GroupSales = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsRange, setAnalyticsRange] = useState('60');
  const [groupPickupInsights, setGroupPickupInsights] = useState(null);
  const [pickupLoading, setPickupLoading] = useState(false);

  const [newGroup, setNewGroup] = useState({
    group_name: '',
    organization: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    check_in: '',
    check_out: '',
    total_rooms: 10,
    group_rate: 100,
    room_type: 'Standard',
    cutoff_date: '',
    billing_type: 'master_account',
    special_requirements: ''
  });

  useEffect(() => {
    loadGroups();
  }, [statusFilter, dateFilter, customStart, customEnd]);

  useEffect(() => {
    loadEventAnalytics(analyticsRange);
  }, [analyticsRange]);

  const loadGroups = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      // Backend date filtering
      if (dateFilter === 'today' || dateFilter === 'this_month') {
        params.date_range = dateFilter;
      } else if (dateFilter === 'custom' && customStart && customEnd) {
        params.date_range = 'custom';
        params.start_date = customStart;
        params.end_date = customEnd;
      }

      const response = await axios.get('/groups/blocks', { params });
      const blocks = response.data.blocks || [];

      setGroups(blocks);
    } catch (error) {
      toast.error('Grup listesi yüklenemedi');
    }
  };

  const loadEventAnalytics = async (range = '60') => {
    try {
      setAnalyticsLoading(true);
      const lookahead = parseInt(range, 10) || 60;
      const response = await axios.get('/events/analytics/overview', {
        params: { lookahead_days: lookahead }
      });
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Etkinlik analitikleri yüklenemedi');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/groups/create-block', newGroup);
      toast.success('Grup bloğu başarıyla oluşturuldu!');
      setShowCreateDialog(false);
      loadGroups();
      setNewGroup({
        group_name: '',
        organization: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        check_in: '',
        check_out: '',
        total_rooms: 10,
        group_rate: 100,
        room_type: 'Standard',
        cutoff_date: '',
        billing_type: 'master_account',
        special_requirements: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Grup oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetails = async (blockId) => {
    try {
      const response = await axios.get(`/groups/block/${blockId}`);
      setGroupDetails(response.data);
      setSelectedGroup(blockId);
      await loadGroupPickup(blockId);
    } catch (error) {
      toast.error('Grup detayları yüklenemedi');
    }
  };

  const loadGroupPickup = async (groupId) => {
    try {
      setPickupLoading(true);
      const response = await axios.get('/events/group-pickup', {
        params: { group_id: groupId }
      });
      setGroupPickupInsights(response.data);
    } catch (error) {
      toast.error('Pickup analitiği yüklenemedi');
    } finally {
      setPickupLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-purple-50"
          >
            <Home className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              👥 Grup Satış Yönetimi
            </h1>
            <p className="text-gray-600">
              Grup rezervasyonları, bloklar ve rooming list yönetimi
            </p>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-5 h-5 mr-2" />
              Yeni Grup Bloğu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Grup Bloğu Oluştur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Grup Adı *</Label>
                  <Input
                    value={newGroup.group_name}
                    onChange={(e) => setNewGroup({...newGroup, group_name: e.target.value})}
                    required
                    placeholder="ABC Şirketi Toplantısı"
                  />
                </div>
                <div>
                  <Label>Organizasyon *</Label>
                  <Input
                    value={newGroup.organization}
                    onChange={(e) => setNewGroup({...newGroup, organization: e.target.value})}
                    required
                    placeholder="ABC Şirketi"
                  />
                </div>
                <div>
                  <Label>İlgili Kişi *</Label>
                  <Input
                    value={newGroup.contact_name}
                    onChange={(e) => setNewGroup({...newGroup, contact_name: e.target.value})}
                    required
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
                <div>
                  <Label>E-posta *</Label>
                  <Input
                    type="email"
                    value={newGroup.contact_email}
                    onChange={(e) => setNewGroup({...newGroup, contact_email: e.target.value})}
                    required
                    placeholder="ahmet@abc.com"
                  />
                </div>
                <div>
                  <Label>Telefon *</Label>
                  <Input
                    value={newGroup.contact_phone}
                    onChange={(e) => setNewGroup({...newGroup, contact_phone: e.target.value})}
                    required
                    placeholder="+90 555 123 45 67"
                  />
                </div>
                <div>
                  <Label>Toplam Oda Sayısı *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newGroup.total_rooms}
                    onChange={(e) => setNewGroup({...newGroup, total_rooms: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <Label>Check-in Tarihi *</Label>
                  <Input
                    type="date"
                    value={newGroup.check_in}
                    onChange={(e) => setNewGroup({...newGroup, check_in: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Check-out Tarihi *</Label>
                  <Input
                    type="date"
                    value={newGroup.check_out}
                    onChange={(e) => setNewGroup({...newGroup, check_out: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Cutoff Tarihi *</Label>
                  <Input
                    type="date"
                    value={newGroup.cutoff_date}
                    onChange={(e) => setNewGroup({...newGroup, cutoff_date: e.target.value})}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Rezervasyon kapanış tarihi</p>
                </div>
                <div>
                  <Label>Grup Fiyatı (€) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newGroup.group_rate}
                    onChange={(e) => setNewGroup({...newGroup, group_rate: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <Label>Oda Tipi</Label>
                  <Select 
                    value={newGroup.room_type}
                    onValueChange={(val) => setNewGroup({...newGroup, room_type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Deluxe">Deluxe</SelectItem>
                      <SelectItem value="Suite">Suite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fatura Tipi</Label>
                  <Select 
                    value={newGroup.billing_type}
                    onValueChange={(val) => setNewGroup({...newGroup, billing_type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="master_account">Master Hesap</SelectItem>
                      <SelectItem value="individual">Bireysel Fatura</SelectItem>
                      <SelectItem value="split">Karma (Split)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Özel Gereksinimler</Label>
                <Textarea
                  value={newGroup.special_requirements}
                  onChange={(e) => setNewGroup({...newGroup, special_requirements: e.target.value})}
                  placeholder="Meeting room, catering, özel istekler..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  İptal
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  {loading ? 'Oluşturuluyor...' : 'Grup Bloğu Oluştur'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event Analytics */}
      <div className="mt-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Etkinlik Analitikleri</h2>
            <p className="text-gray-600 text-sm">Önümüzdeki dönem için toplantı & etkinlik performansı</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-600">Bakış Penceresi</Label>
            <Select value={analyticsRange} onValueChange={setAnalyticsRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Gün</SelectItem>
                <SelectItem value="60">60 Gün</SelectItem>
                <SelectItem value="90">90 Gün</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analitikler yükleniyor...
          </div>
        ) : analytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Projeksiyon</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">€{analytics.projected_revenue?.toLocaleString('tr-TR')}</p>
                  <p className="text-sm text-gray-500 mt-1">{analytics.total_events} etkinlik • {analytics.window_days} gün</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Ortalama Katılımcı</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.average_attendance}</p>
                  <p className="text-sm text-gray-500 mt-1">Etkinlik başına</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Popüler Setup</p>
                  <p className="text-lg font-semibold text-green-600 mt-2">
                    {Object.keys(analytics.events_by_setup || {}).sort((a, b) => (analytics.events_by_setup[b] || 0) - (analytics.events_by_setup[a] || 0))[0] || 'Belirtilmedi'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Setup tipine göre dağılım</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Önerilen Aksiyon</p>
                  <p className="text-sm text-gray-800 mt-2">
                    {analytics.total_events > 0 ? 'Yüksek değerli etkinlikler için upsell fırsatlarını tetikle' : 'Yeni M&E kampanyası başlat'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Activity className="w-4 h-4 mr-2" />
                    Aksiyon Planı
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-purple-600" />
                    En Yüksek Gelirli 5 Etkinlik
                  </CardTitle>
                  <p className="text-sm text-gray-500">Gelir ve katılımcı detayları</p>
                </CardHeader>
                <CardContent>
                  {analytics.top_events?.length ? (
                    <div className="space-y-3">
                      {analytics.top_events.map((event) => (
                        <div key={`${event.event_name}-${event.event_date}`} className="flex items-center justify-between border rounded-lg p-3">
                          <div>
                            <p className="font-semibold text-gray-900">{event.event_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.event_date).toLocaleDateString('tr-TR')} • {event.expected_attendees} katılımcı
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Tahmini Gelir</p>
                            <p className="text-lg font-bold text-green-600">€{Number(event.total_cost).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Seçilen döneme ait etkinlik bulunamadı.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Haftalık Zaman Çizelgesi
                  </CardTitle>
                  <p className="text-sm text-gray-500">Etkinlik adedi ve gelir</p>
                </CardHeader>
                <CardContent>
                  {analytics.timeline?.length ? (
                    <div className="space-y-3">
                      {analytics.timeline.slice(0, 6).map((week) => (
                        <div key={week.week_start} className="flex items-center justify-between border rounded-lg p-3">
                          <div>
                            <p className="font-semibold">{new Date(week.week_start).toLocaleDateString('tr-TR')}</p>
                            <p className="text-xs text-gray-500">{week.events} etkinlik</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Gelir</p>
                            <p className="text-lg font-bold text-amber-600">€{Number(week.revenue).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Henüz zaman çizelgesi verisi yok.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-gray-500">
              Analitik verisi bulunamadı. Daha fazla etkinlik oluşturduğunuzda bu alan otomatik dolacak.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs text-gray-600">Durum</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tüm durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="tentative">Opsiyonel</SelectItem>
              <SelectItem value="definite">Kesin</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-600">Tarih Aralığı (Check-in)</Label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="this_month">Bu Ay</SelectItem>
              <SelectItem value="next_30">Önümüzdeki 30 Gün</SelectItem>
              <SelectItem value="custom">Özel Aralık</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-600">Başlangıç</Label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Bitiş</Label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Group List */}
      <div className="grid grid-cols-1 gap-4">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Henüz grup rezervasyonu yok</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                İlk Grup Bloğunu Oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <Card 
              key={group.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => loadGroupDetails(group.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{group.group_name}</h3>
                      <StatusBadge status={group.status} />
                    </div>
                    <p className="text-gray-600 mb-3">{group.organization}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Check-in</p>
                        <p className="font-semibold">{new Date(group.check_in).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Toplam Oda</p>
                        <p className="font-semibold">{group.total_rooms} oda</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pickup</p>
                        <p className="font-semibold">{group.rooms_picked_up} / {group.total_rooms}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Grup Fiyatı</p>
                        <p className="font-semibold">€{group.group_rate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600">
                      {Math.round((group.rooms_picked_up / group.total_rooms) * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Pickup Oranı</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Group Details Modal */}
      {selectedGroup && groupDetails && (
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {groupDetails.block.group_name}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                <TabsTrigger value="bookings">Rezervasyonlar ({groupDetails.bookings_count})</TabsTrigger>
                <TabsTrigger value="folio">Master Folio</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pickup Durumu</CardTitle>
                    <p className="text-sm text-gray-500">MeetingEventsService analitiği</p>
                  </CardHeader>
                  <CardContent>
                    {pickupLoading ? (
                      <div className="flex items-center justify-center py-6 text-gray-500">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Pickup verisi yükleniyor...
                      </div>
                    ) : groupPickupInsights ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Toplam Oda</p>
                            <p className="text-2xl font-bold">{groupPickupInsights.pickup_summary.total_rooms_blocked}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Alınan Oda</p>
                            <p className="text-2xl font-bold text-green-600">{groupPickupInsights.pickup_summary.rooms_picked_up}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Pickup Oranı</p>
                            <p className="text-2xl font-bold text-purple-600">{groupPickupInsights.pickup_summary.pickup_percentage}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Tahmini Gelir</p>
                            <p className="text-xl font-bold text-amber-600">€{groupPickupInsights.pickup_summary.expected_revenue?.toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${groupPickupInsights.pickup_summary.pickup_percentage}%` }}
                            />
                          </div>
                          {groupPickupInsights.next_milestone && (
                            <p className="text-xs text-gray-500 mt-2">
                              %{groupPickupInsights.next_milestone.target_percentage} seviyesine ulaşmak için {groupPickupInsights.next_milestone.rooms_needed} oda daha gerekli.
                            </p>
                          )}
                        </div>
                      </>
                    ) : groupDetails.pickup ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Toplam Oda</p>
                          <p className="text-2xl font-bold">{groupDetails.pickup.total_rooms}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Alınan Oda</p>
                          <p className="text-2xl font-bold text-green-600">{groupDetails.pickup.rooms_picked_up}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pickup Oranı</p>
                          <p className="text-2xl font-bold text-purple-600">{groupDetails.pickup.pickup_percentage}%</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Pickup verisi bulunamadı.</p>
                    )}
                  </CardContent>
                </Card>

                {groupPickupInsights && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Pace Analizi</CardTitle>
                        <p className="text-sm text-gray-500">Gün bazında pickup hareketi</p>
                      </CardHeader>
                      <CardContent>
                        {groupPickupInsights.pace?.length ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {groupPickupInsights.pace.map((entry) => (
                              <div key={entry.date} className="flex items-center justify-between border rounded-lg p-3">
                                <span className="font-medium">{new Date(entry.date).toLocaleDateString('tr-TR')}</span>
                                <span className="text-sm text-gray-600">+{entry.rooms_added} oda</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Henüz pace verisi yok.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Oda Tipi Dağılımı</CardTitle>
                        <p className="text-sm text-gray-500">Pickup edilen odaların kırılımı</p>
                      </CardHeader>
                      <CardContent>
                        {Object.keys(groupPickupInsights.room_type_distribution || {}).length ? (
                          <div className="space-y-3">
                            {Object.entries(groupPickupInsights.room_type_distribution).map(([roomType, count]) => (
                              <div key={roomType}>
                                <div className="flex items-center justify-between">
                                  <span className="capitalize">{roomType}</span>
                                  <span className="font-semibold">{count} oda</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full mt-1">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{
                                      width: `${(count / (groupPickupInsights.pickup_summary.rooms_picked_up || 1)) * 100}%`
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Oda tipi dağılımı bulunamadı.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>İletişim Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{groupDetails.block.contact_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{groupDetails.block.contact_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{groupDetails.block.contact_phone}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings">
                <div className="space-y-3">
                  {groupDetails.bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Henüz rezervasyon oluşturulmamış
                    </div>
                  ) : (
                    groupDetails.bookings.map((booking, idx) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">#{idx + 1} - Misafir ID: {booking.guest_id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.check_in).toLocaleDateString('tr-TR')} - 
                                {new Date(booking.check_out).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Tutar</p>
                              <p className="text-lg font-bold">€{booking.total_amount}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="folio">
                <Card>
                  <CardHeader>
                    <CardTitle>Master Folio Özeti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Master folio özelliği yakında aktif olacak
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Statistics Summary */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Toplam Grup</p>
                <p className="text-3xl font-bold text-purple-600">{groups.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Toplam Oda</p>
                <p className="text-3xl font-bold text-blue-600">
                  {groups.reduce((sum, g) => sum + g.total_rooms, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Alınan Oda</p>
                <p className="text-3xl font-bold text-green-600">
                  {groups.reduce((sum, g) => sum + (g.rooms_picked_up || 0), 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Potansiyel Oda Geliri</p>
                <p className="text-xl font-bold text-amber-600">
                  €{groups.reduce((sum, g) => sum + (g.total_rooms * (g.group_rate || 0)), 0).toFixed(0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Ort. Pickup</p>
                <p className="text-3xl font-bold text-orange-600">
                  {groups.length > 0 
                    ? Math.round(groups.reduce((sum, g) => sum + ((g.rooms_picked_up || 0) / g.total_rooms * 100), 0) / groups.length)
                    : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GroupSales;
