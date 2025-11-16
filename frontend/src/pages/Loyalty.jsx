import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Users, TrendingUp, Gift, Star, Crown, Gem } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Loyalty = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyMembers();
  }, []);

  const fetchLoyaltyMembers = async () => {
    try {
      const response = await api.get('/guests');
      const loyaltyMembers = response.data.filter(g => g.loyalty_member);
      setMembers(loyaltyMembers);
    } catch (error) {
      console.error('Error fetching loyalty members:', error);
      toast.error('Sadakat üyeleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    {
      name: 'Bronze',
      icon: Award,
      color: 'from-amber-700 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      minPoints: 0,
      maxPoints: 499,
      benefits: ['%5 indirim', 'Ücretsiz WiFi', 'Erken check-in']
    },
    {
      name: 'Silver',
      icon: Star,
      color: 'from-slate-400 to-slate-500',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-600',
      minPoints: 500,
      maxPoints: 999,
      benefits: ['%10 indirim', 'Ücretsiz otopark', 'Oda yükseltme', 'Late check-out']
    },
    {
      name: 'Gold',
      icon: Crown,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      minPoints: 1000,
      maxPoints: 2499,
      benefits: ['%15 indirim', 'Ücretsiz kahvaltı', 'VIP lounge', 'Havaalanı transferi']
    },
    {
      name: 'Platinum',
      icon: Gem,
      color: 'from-indigo-600 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      minPoints: 2500,
      maxPoints: null,
      benefits: ['%20 indirim', 'Ücretsiz suite upgrade', 'Exclusive services', 'Özel etkinlikler']
    }
  ];

  const stats = [
    { label: 'Toplam Üye', value: members.length || 0, icon: Users, color: 'text-blue-600' },
    { label: 'Aktif Üyeler', value: members.length || 0, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Bu Ay Yeni', value: '12', icon: Gift, color: 'text-purple-600' },
    { label: 'Toplam Puan', value: members.reduce((sum, m) => sum + m.loyalty_points, 0), icon: Award, color: 'text-amber-600' }
  ];

  const getTierForPoints = (points) => {
    return tiers.find(tier => 
      points >= tier.minPoints && (tier.maxPoints === null || points <= tier.maxPoints)
    ) || tiers[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div data-testid="loyalty-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{fontFamily: 'Plus Jakarta Sans'}}>Loyalty Program</h1>
          <p className="text-slate-500">Sadakat programı yönetimi ve üye avantajları</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
          <Users className="w-4 h-4 mr-2" />
          Yeni Üye Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tier Benefits */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900" style={{fontFamily: 'Plus Jakarta Sans'}}>Üyelik Kademeleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {tiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <div key={index} className={`p-6 rounded-2xl ${tier.bgColor} border-2 border-slate-200 hover:border-blue-300 transition-all`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${tier.textColor}`}>{tier.name}</h3>
                      <p className="text-xs text-slate-500">
                        {tier.minPoints}+ puan
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {tier.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${tier.textColor} mt-1.5`}></div>
                        <p className="text-sm text-slate-600">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900" style={{fontFamily: 'Plus Jakarta Sans'}}>Sadakat Üyeleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Henüz sadakat üyesi bulunmuyor
              </div>
            ) : (
              members.map((member) => {
                const tier = getTierForPoints(member.loyalty_points);
                const TierIcon = tier.icon;
                return (
                  <div key={member.id} data-testid={`loyalty-member-${member.id}`} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-md`}>
                        <TierIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{member.first_name} {member.last_name}</h4>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Kademe</p>
                        <Badge className={`${tier.bgColor} ${tier.textColor} border-0`}>
                          {tier.name}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Puan</p>
                        <p className="text-xl font-bold text-blue-600">{member.loyalty_points}</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-slate-200">
                        Detay
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Loyalty;
