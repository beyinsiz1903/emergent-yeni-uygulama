import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, DoorOpen, DoorClosed, TrendingUp, Calendar, Users } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div data-testid="dashboard-loading" className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Oda',
      value: stats?.total_rooms || 0,
      icon: Hotel,
      color: 'from-blue-500 to-blue-600',
      testId: 'stat-total-rooms'
    },
    {
      title: 'Dolu Odalar',
      value: stats?.occupied_rooms || 0,
      icon: DoorClosed,
      color: 'from-amber-500 to-amber-600',
      testId: 'stat-occupied-rooms'
    },
    {
      title: 'Müsait Odalar',
      value: stats?.available_rooms || 0,
      icon: DoorOpen,
      color: 'from-green-500 to-green-600',
      testId: 'stat-available-rooms'
    },
    {
      title: 'Doluluk Oranı',
      value: `${stats?.occupancy_rate || 0}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      testId: 'stat-occupancy-rate'
    },
    {
      title: 'Bugün Giriş',
      value: stats?.today_checkins || 0,
      icon: Calendar,
      color: 'from-cyan-500 to-cyan-600',
      testId: 'stat-today-checkins'
    },
    {
      title: 'Bugün Çıkış',
      value: stats?.today_checkouts || 0,
      icon: Calendar,
      color: 'from-rose-500 to-rose-600',
      testId: 'stat-today-checkouts'
    },
    {
      title: 'Bekleyen Rezervasyonlar',
      value: stats?.pending_reservations || 0,
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      testId: 'stat-pending-reservations'
    },
    {
      title: 'Bugün Gelir',
      value: `$${stats?.revenue_today || 0}`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      testId: 'stat-revenue-today'
    },
  ];

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{fontFamily: 'Plus Jakarta Sans'}}>Dashboard</h1>
          <p className="text-slate-500">Otel işletmenizin genel görünümü</p>
        </div>
        <div className="text-sm text-slate-500">
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} data-testid={stat.testId} className="bg-white border-slate-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900" style={{fontFamily: 'Plus Jakarta Sans'}}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-blue-500/20`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-900" style={{fontFamily: 'Plus Jakarta Sans'}}>Aylık Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent" style={{fontFamily: 'Plus Jakarta Sans'}}>
              ${stats?.revenue_month || 0}
            </div>
            <p className="text-sm text-slate-500 mt-2">Bu ay toplam gelir</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 border-0 text-white">
          <CardHeader>
            <CardTitle className="text-white" style={{fontFamily: 'Plus Jakarta Sans'}}>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/reservations/new" data-testid="quick-new-reservation" className="block p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20">
              <p className="text-white font-semibold">Yeni Rezervasyon</p>
              <p className="text-xs text-blue-100">Hızlı rezervasyon oluştur</p>
            </a>
            <a href="/calendar" data-testid="quick-calendar" className="block p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20">
              <p className="text-white font-semibold">Oda Takvimi</p>
              <p className="text-xs text-blue-100">Müsaitlik ve fiyatları gör</p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
