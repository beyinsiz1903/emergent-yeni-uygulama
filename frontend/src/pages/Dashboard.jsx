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
    <div data-testid="dashboard-page" className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Dashboard</h1>
        <p className="text-gray-400">Otel işletmenizin genel görünümü</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} data-testid={stat.testId} className="bg-[#16161a] border-[#2a2a2d] hover:border-amber-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#16161a] border-[#2a2a2d]">
          <CardHeader>
            <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Aylık Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-400" style={{fontFamily: 'Space Grotesk'}}>
              ${stats?.revenue_month || 0}
            </div>
            <p className="text-sm text-gray-400 mt-2">Bu ay toplam gelir</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16161a] border-[#2a2a2d]">
          <CardHeader>
            <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/reservations/new" data-testid="quick-new-reservation" className="block p-4 rounded-lg bg-[#1f1f23] hover:bg-[#2a2a2d] transition-colors border border-[#2a2a2d] hover:border-amber-500/30">
              <p className="text-white font-medium">Yeni Rezervasyon</p>
              <p className="text-sm text-gray-400">Hızlı rezervasyon oluştur</p>
            </a>
            <a href="/calendar" data-testid="quick-calendar" className="block p-4 rounded-lg bg-[#1f1f23] hover:bg-[#2a2a2d] transition-colors border border-[#2a2a2d] hover:border-amber-500/30">
              <p className="text-white font-medium">Oda Takvimi</p>
              <p className="text-sm text-gray-400">Müsaitlik ve fiyatları gör</p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
