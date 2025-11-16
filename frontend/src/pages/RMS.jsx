import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const RMS = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    currentADR: 245,
    targetADR: 280,
    revPAR: 189,
    occupancyRate: 72,
    forecastAccuracy: 94
  });

  const priceRecommendations = [
    {
      roomType: 'Standard Room',
      currentPrice: 150,
      recommendedPrice: 165,
      change: '+10%',
      reason: 'Yüksek talep bekleniyor',
      confidence: 92
    },
    {
      roomType: 'Deluxe Room',
      currentPrice: 250,
      recommendedPrice: 235,
      change: '-6%',
      reason: 'Rekabet fiyatlandırması',
      confidence: 87
    },
    {
      roomType: 'Suite',
      currentPrice: 400,
      recommendedPrice: 450,
      change: '+12.5%',
      reason: 'Özel etkinlik dönemi',
      confidence: 95
    }
  ];

  const marketInsights = [
    { title: 'Hafta Sonu Talebi', value: '+28%', trend: 'up', color: 'text-green-600' },
    { title: 'Rakip Fiyat İndeksi', value: '1.12', trend: 'up', color: 'text-blue-600' },
    { title: 'Booking Window', value: '18 gün', trend: 'down', color: 'text-orange-600' },
    { title: 'İptal Oranı', value: '8.2%', trend: 'down', color: 'text-red-600' }
  ];

  return (
    <div data-testid="rms-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{fontFamily: 'Plus Jakarta Sans'}}>Revenue Management System</h1>
          <p className="text-slate-500">Fiyatlandırma optimizasyonu ve gelir yönetimi</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
          <TrendingUp className="w-4 h-4 mr-2" />
          Fiyatları Optimize Et
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">ADR</p>
                <p className="text-xl font-bold text-slate-900">${stats.currentADR}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500">Hedef:</span>
              <span className="font-semibold text-blue-600">${stats.targetADR}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">RevPAR</p>
                <p className="text-xl font-bold text-slate-900">${stats.revPAR}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="font-semibold">+12% YoY</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Doluluk</p>
                <p className="text-xl font-bold text-slate-900">{stats.occupancyRate}%</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-purple-600">
              <TrendingUp className="w-3 h-3" />
              <span className="font-semibold">+5% MTD</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Tahmin Doğruluğu</p>
                <p className="text-xl font-bold text-slate-900">{stats.forecastAccuracy}%</p>
              </div>
            </div>
            <div className="text-xs text-slate-500">Son 30 gün</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-100">Aylık Gelir</p>
                <p className="text-xl font-bold text-white">$285K</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-100">
              <TrendingUp className="w-3 h-3" />
              <span className="font-semibold">+18% vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Recommendations */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900" style={{fontFamily: 'Plus Jakarta Sans'}}>Fiyat Önerileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priceRecommendations.map((rec, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">{rec.roomType}</h4>
                  <p className="text-sm text-slate-500">{rec.reason}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Mevcut</p>
                    <p className="text-lg font-semibold text-slate-900">${rec.currentPrice}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.change.startsWith('+') ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${rec.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {rec.change}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Önerilen</p>
                    <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ${rec.recommendedPrice}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Güven</p>
                    <p className="text-sm font-semibold text-blue-600">{rec.confidence}%</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Uygula
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900" style={{fontFamily: 'Plus Jakarta Sans'}}>Pazar Trendleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {marketInsights.map((insight, index) => (
                <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">{insight.title}</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${insight.color}`}>{insight.value}</p>
                    {insight.trend === 'up' ? (
                      <TrendingUp className={`w-4 h-4 ${insight.color}`} />
                    ) : (
                      <TrendingDown className={`w-4 h-4 ${insight.color}`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900" style={{fontFamily: 'Plus Jakarta Sans'}}>Gelecek Tahminleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-900">Önümüzdeki 7 Gün</p>
                  <span className="text-sm font-semibold text-blue-600">Yüksek Talep</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Beklenen Doluluk:</span>
                    <span className="ml-2 font-semibold text-slate-900">85%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tahmini ADR:</span>
                    <span className="ml-2 font-semibold text-slate-900">$268</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-900">Önümüzdeki 30 Gün</p>
                  <span className="text-sm font-semibold text-green-600">Orta Talep</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Beklenen Doluluk:</span>
                    <span className="ml-2 font-semibold text-slate-900">68%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tahmini ADR:</span>
                    <span className="ml-2 font-semibold text-slate-900">$242</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RMS;
