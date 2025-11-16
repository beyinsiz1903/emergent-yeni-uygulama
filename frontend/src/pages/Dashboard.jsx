import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Hotel, TrendingUp, Calendar, Users, FileText, Award, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Total Rooms',
      value: stats?.total_rooms || 0,
      icon: Hotel,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Occupancy Rate',
      value: `${stats?.occupancy_rate || 0}%`,
      icon: TrendingUp,
      color: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: "Today's Check-ins",
      value: stats?.today_checkins || 0,
      icon: Calendar,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Total Guests',
      value: stats?.occupied_rooms || 0,
      icon: Users,
      color: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  const modules = [
    {
      title: 'PMS',
      subtitle: 'Property Management System',
      icon: Hotel,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      link: '/reservations',
      stats: [
        { label: 'Total Rooms', value: stats?.total_rooms || 0 },
        { label: 'Occupied Rooms', value: stats?.occupied_rooms || 0 }
      ]
    },
    {
      title: 'Invoices',
      subtitle: 'Billing & Reporting',
      icon: FileText,
      color: 'bg-pink-100',
      iconColor: 'text-pink-600',
      link: '/invoices',
      stats: [
        { label: 'Total Invoices', value: 0 },
        { label: 'Total Revenue', value: 0 }
      ]
    },
    {
      title: 'RMS',
      subtitle: 'Revenue Management',
      icon: TrendingUp,
      color: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      link: '/rms',
      stats: []
    },
    {
      title: 'Loyalty',
      subtitle: 'Guest Rewards Program',
      icon: Award,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
      link: '/loyalty',
      stats: []
    },
    {
      title: 'Marketplace',
      subtitle: 'Wholesale Purchasing',
      icon: ShoppingBag,
      color: 'bg-rose-100',
      iconColor: 'text-rose-600',
      link: '/marketplace',
      stats: []
    }
  ];

  const quickActions = [
    {
      title: 'New Reservation',
      description: 'Create a new booking',
      icon: Calendar,
      color: 'bg-blue-600',
      link: '/reservations/new'
    },
    {
      title: 'View Calendar',
      description: 'Check room availability',
      icon: Calendar,
      color: 'bg-green-600',
      action: () => window.location.href = '/reservations?tab=calendar'
    },
    {
      title: 'Check-in Guest',
      description: 'Process arrival',
      icon: Users,
      color: 'bg-purple-600',
      link: '/reservations?tab=arrivals'
    },
    {
      title: 'View Reports',
      description: 'Revenue & occupancy',
      icon: TrendingUp,
      color: 'bg-orange-600',
      link: '/rms'
    }
  ];

  return (
    <div data-testid="dashboard-page" className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, Hotel Administrator</h1>
        <p className="text-lg text-gray-600">Grand Canyon Hotel</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} data-testid={`summary-${index}`} className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Your Modules */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link key={index} to={module.link}>
                <Card data-testid={`module-${index}`} className="bg-white border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl ${module.color} flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${module.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.subtitle}</p>
                      </div>
                    </div>
                    {module.stats && module.stats.length > 0 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        {module.stats.map((stat, idx) => (
                          <div key={idx}>
                            <p className="text-xs text-gray-600">{stat.label}</p>
                            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
