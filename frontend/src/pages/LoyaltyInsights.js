import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, Gift, Activity, RefreshCw, Home, ShieldCheck } from 'lucide-react';

const metricCards = (
  summary = {}
) => [
  {
    id: 'members',
    label: 'Toplam Üye',
    value: summary.total_members || 0,
    icon: Users,
    accent: 'text-purple-600'
  },
  {
    id: 'active',
    label: 'Aktif Üye',
    value: summary.active_members || 0,
    caption: `${(summary.active_rate || 0).toFixed(1)}% aktif`,
    icon: Activity,
    accent: 'text-green-600'
  },
  {
    id: 'points',
    label: 'Toplam Puan',
    value: summary.points_outstanding || 0,
    prefix: '₺',
    icon: Gift,
    accent: 'text-amber-600'
  },
  {
    id: 'redemption',
    label: 'Kullanım Oranı',
    value: `${(summary.redemption_rate || 0).toFixed(1)}%`,
    caption: `${(summary.points_redeemed || 0).toLocaleString('tr-TR')} puan kullanıldı`,
    icon: TrendingUp,
    accent: 'text-blue-600'
  }
];

const LoyaltyInsights = () => {
  const [insights, setInsights] = useState(null);
  const [lookback, setLookback] = useState('90');
  const [loading, setLoading] = useState(true);
  const [automationRuns, setAutomationRuns] = useState([]);
  const [automationMetrics, setAutomationMetrics] = useState(null);
  const [runningAction, setRunningAction] = useState(null);
  const [segments, setSegments] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadInsights(lookback);
  }, [lookback]);

  useEffect(() => {
    loadAutomationRuns();
  }, []);

  const loadInsights = async (range) => {
    try {
      setLoading(true);
      const lookbackValue = parseInt(range, 10);
      const [insightsRes, metricsRes] = await Promise.all([
        axios.get('/loyalty/insights', { params: { lookback_days: lookbackValue } }),
        axios.get('/loyalty/actions/metrics', { params: { lookback_days: lookbackValue } })
      ]);
      setInsights(insightsRes.data);
      setAutomationMetrics(metricsRes.data);
    } catch (error) {
      toast.error('Loyalty analitikleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadAutomationRuns = async () => {
    try {
      const response = await axios.get('/loyalty/actions', { params: { limit: 12 } });
      setAutomationRuns(response.data?.runs || []);
    } catch (error) {
      console.error(error);
    }
  };

  const triggerAutomation = async (actionId, segment) => {
    try {
      setRunningAction(actionId);
      const payload = {
        action_id: actionId,
        lookback_days: parseInt(lookback, 10)
      };
      if (segment && segment !== 'all') {
        payload.segment = segment;
      }
      await axios.post('/loyalty/actions/run', payload);
      toast.success('Otomasyon kuyruğa alındı');
      await Promise.all([loadAutomationRuns(), loadInsights(lookback)]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Otomasyon tetiklenemedi');
    } finally {
      setRunningAction(null);
    }
  };

  if (!insights && loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-500">Analitikler yükleniyor...</p>
      </div>
    );
  }

  const refreshing = loading && Boolean(insights);
  const summary = insights?.summary || {};
  const tierBreakdown = insights?.tier_breakdown || [];
  const trend = insights?.points_trend || [];
  const topMembers = insights?.top_members || [];
  const churnRisk = insights?.churn_risk || [];
  const expiringSoon = insights?.expiring_points?.expiring_soon || [];
  const partnerActivity = insights?.partner_activity || {};
  const promotions = insights?.active_promotions || [];
  const actions = insights?.recommended_actions || [];
  const generatedAt = insights?.generated_at
    ? new Date(insights.generated_at).toLocaleString('tr-TR')
    : null;
  const segmentOptions = [
    { value: 'all', label: 'Tüm Üyeler' },
    { value: 'high_value', label: 'High Value (5K+ pts)' },
    { value: 'dormant', label: 'Dormant 60+ gün' },
    { value: 'vip', label: 'VIP (Platinum+)' },
    { value: 'expiring', label: 'Yakında süresi dolan' },
  ];
  const topActionSegment = loyaltyTopAction ? (segments[loyaltyTopAction.id] || 'all') : 'all';

  const formatNumber = (value = 0) => value.toLocaleString('tr-TR');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-purple-600">Sadakat Analitiği</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Loyalty Insights Center</h1>
          {generatedAt && (
            <p className="text-sm text-gray-500">Son güncelleme: {generatedAt}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {refreshing && (
            <div className="flex items-center text-xs text-gray-500">
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              Güncelleniyor
            </div>
          )}
          <Select value={lookback} onValueChange={setLookback}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Lookback" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Gün</SelectItem>
              <SelectItem value="60">60 Gün</SelectItem>
              <SelectItem value="90">90 Gün</SelectItem>
              <SelectItem value="180">180 Gün</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigate('/')}> 
            <Home className="w-4 h-4 mr-2" />Ana Sayfa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards(summary).map((card) => (
          <Card key={card.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {typeof card.value === 'number' && card.id !== 'redemption'
                      ? formatNumber(card.value)
                      : card.value}
                  </p>
                  {card.caption && (
                    <p className="text-xs text-gray-500 mt-1">{card.caption}</p>
                  )}
                </div>
                <card.icon className={`w-10 h-10 ${card.accent}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tier Dağılımı</CardTitle>
            <p className="text-sm text-gray-500">Program yoğunluğu</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {tierBreakdown.length === 0 && (
              <p className="text-sm text-gray-500">Veri bulunamadı</p>
            )}
            {tierBreakdown.map((tier) => (
              <div key={tier.tier}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize font-medium">{tier.tier}</span>
                  <span>{tier.count} üye • %{tier.percentage}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full mt-1">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    style={{ width: `${tier.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ay Bazında Puan Akışı</CardTitle>
            <p className="text-sm text-gray-500">Kazanım vs kullanım</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {trend.length === 0 && (
              <p className="text-sm text-gray-500">Seçilen aralıkta işlem bulunamadı</p>
            )}
            {trend.map((item) => (
              <div key={item.period} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="text-sm font-semibold">{item.period}</p>
                  <p className="text-xs text-gray-500">Earned / Redeemed</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Kazanılan</p>
                  <p className="font-semibold text-green-600">{formatNumber(item.earned)}</p>
                  <p className="text-xs text-gray-500 mt-1">Kullanılan</p>
                  <p className="font-semibold text-amber-600">{formatNumber(item.redeemed)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Üyeler</CardTitle>
            <p className="text-sm text-gray-500">Puan ve yükseltme fırsatları</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topMembers.length === 0 && <p className="text-sm text-gray-500">Üye bulunamadı</p>}
            {topMembers.map((member) => (
              <div key={member.guest_id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{member.guest_name || member.guest_id}</p>
                    <Badge variant="outline" className="capitalize mt-1">{member.tier}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Puan</p>
                    <p className="text-lg font-bold text-purple-600">{formatNumber(member.points || 0)}</p>
                  </div>
                </div>
                {member.next_tier && (
                  <p className="text-xs text-gray-500 mt-2">
                    {member.next_tier.toUpperCase()} için {formatNumber(member.points_to_next_tier || 0)} puan kaldı
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Churn Risk</CardTitle>
            <p className="text-sm text-gray-500">60+ gündür pasif üyeler</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {churnRisk.length === 0 && <p className="text-sm text-gray-500">Riskli üye bulunamadı</p>}
            {churnRisk.map((member) => (
              <div key={member.guest_id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{member.guest_name || member.guest_id}</p>
                    <p className="text-xs text-gray-500">{member.days_inactive} gündür pasif</p>
                  </div>
                  <Badge
                    variant={member.risk_level === 'high' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {member.risk_level} risk
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {automationMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Automation Performance</span>
              <Badge variant="outline">
                {automationMetrics.lookback_days}g lookback
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-500">Delivery & başarı oranları</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-xs text-gray-500 uppercase">Total Campaigns</p>
                <p className="text-2xl font-semibold">{automationMetrics.summary.total_runs}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-xs text-gray-500 uppercase">Completion Rate</p>
                <p className="text-2xl font-semibold">
                  {automationMetrics.summary.total_runs
                    ? `${((automationMetrics.summary.completed_runs / automationMetrics.summary.total_runs) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-xs text-gray-500 uppercase">Notifications Sent</p>
                <p className="text-2xl font-semibold">{automationMetrics.summary.notifications_sent}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-xs text-gray-500 uppercase">Email / WhatsApp</p>
                <p className="text-2xl font-semibold">
                  {automationMetrics.summary.emails_sent} / {automationMetrics.summary.whatsapp_sent}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {automationMetrics.actions.map((action) => (
                <div key={action.action_id} className="p-3 border rounded bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{action.title}</p>
                      <p className="text-xs text-gray-500">
                        {action.runs} runs • {action.notifications} notifications
                      </p>
                    </div>
                    <Badge variant="outline">
                      {action.completion_rate}% success
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.min(action.completion_rate, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last run: {action.last_run_at ? new Date(action.last_run_at).toLocaleString('tr-TR') : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Yakında Süresi Dolan Puanlar</CardTitle>
            <p className="text-sm text-gray-500">
              Toplam risk: {formatNumber(insights?.expiring_points?.total_points_at_risk || 0)} puan
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiringSoon.length === 0 && <p className="text-sm text-gray-500">Yakın zamanda biten puan yok</p>}
            {expiringSoon.slice(0, 4).map((item) => (
              <div key={item.guest_id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{item.guest_name || item.guest_id}</p>
                  <p className="text-xs text-gray-500">
                    {item.expiration_date
                      ? new Date(item.expiration_date).toLocaleDateString('tr-TR')
                      : 'Tarih yok'}
                  </p>
                </div>
                <p className="font-semibold text-amber-600">{formatNumber(item.points_expiring)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partner Aktivitesi</CardTitle>
            <p className="text-sm text-gray-500">Transfer özeti</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Partner sayısı</span>
              <span className="font-semibold">{partnerActivity.total_transfers || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Gönderilen puan</span>
              <span className="font-semibold text-purple-600">{formatNumber(partnerActivity.points_to_partner || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Alınan puan</span>
              <span className="font-semibold text-green-600">{formatNumber(partnerActivity.points_from_partner || 0)}</span>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-2">Son transferler</p>
              {partnerActivity.recent_transfers?.length ? (
                partnerActivity.recent_transfers.slice(0, 3).map((transfer, idx) => (
                  <div key={`${transfer.guest_id}-${idx}`} className="flex justify-between text-xs py-1">
                    <span>{transfer.partner}</span>
                    <span>{formatNumber(transfer.points || 0)} puan</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">Veri yok</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktif Kampanyalar</CardTitle>
            <p className="text-sm text-gray-500">Promosyon durumu</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {promotions.length === 0 && <p className="text-sm text-gray-500">Aktif kampanya yok</p>}
            {promotions.map((promo) => (
              <div key={promo.id} className="border rounded-lg p-3">
                <p className="font-semibold">{promo.offer}</p>
                <p className="text-xs text-gray-500">Hedef: {promo.target_tier}</p>
                {promo.valid_until && (
                  <p className="text-xs text-gray-500">Bitiş: {promo.valid_until}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Aksiyon Önerileri
            <Badge variant="outline" className="ml-2">{actions.length} öneri</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.length === 0 && <p className="text-sm text-gray-500">Şu an için otomatik aksiyon önerisi yok</p>}
          {actions.map((action) => (
            <div key={action.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{action.title}</p>
                <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'} className="capitalize">
                  {action.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{action.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4" />
                {action.category}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Segment</p>
                <Select
                  value={segments[action.id] || 'all'}
                  onValueChange={(val) => setSegments((prev) => ({ ...prev, [action.id]: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Segment seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {segmentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                className="w-full"
                disabled={runningAction === action.id}
                onClick={() => triggerAutomation(action.id, segments[action.id])}
              >
                {runningAction === action.id ? 'Çalışıyor...' : 'Otomasyonu Başlat'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Otomasyon Geçmişi</CardTitle>
          <p className="text-sm text-gray-500">Son 12 çalışma</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {automationRuns.length === 0 && <p className="text-sm text-gray-500">Henüz otomasyon çalıştırılmadı</p>}
          {automationRuns.map((run) => (
            <div key={run.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{run.title}</p>
                  <p className="text-xs text-gray-500">{run.created_at ? new Date(run.created_at).toLocaleString('tr-TR') : ''}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {run.summary?.category || 'otomasyon'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Hedef: {run.targets?.length || 0} üye</p>
              {run.summary?.message && (
                <p className="text-xs text-gray-500 italic">“{run.summary.message}”</p>
              )}
              {run.summary?.offer && (
                <p className="text-xs text-gray-500 italic">Teklif: {run.summary.offer}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyInsights;
