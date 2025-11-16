import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Utensils, Dumbbell, Waves, Sparkles, Coffee, Wine, Camera } from 'lucide-react';

const Marketplace = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tümü', icon: ShoppingBag },
    { id: 'dining', name: 'Yeme & İçme', icon: Utensils },
    { id: 'wellness', name: 'Wellness & Spa', icon: Sparkles },
    { id: 'activities', name: 'Aktiviteler', icon: Waves },
    { id: 'services', name: 'Hizmetler', icon: Coffee }
  ];

  const products = [
    {
      id: 1,
      category: 'dining',
      name: 'Romantik Akşam Yemeği',
      description: 'Sahilde özel masa, 3 kurs menü',
      price: 150,
      icon: Wine,
      color: 'from-rose-500 to-pink-600',
      popular: true
    },
    {
      id: 2,
      category: 'dining',
      name: 'Kahvaltı Paketi',
      description: 'Odaya özel kahvaltı servisi',
      price: 45,
      icon: Coffee,
      color: 'from-amber-500 to-orange-600',
      popular: false
    },
    {
      id: 3,
      category: 'wellness',
      name: 'Çiftler Masajı',
      description: '60 dakika rahatlatıcı masaj',
      price: 200,
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-600',
      popular: true
    },
    {
      id: 4,
      category: 'wellness',
      name: 'Spa Günü',
      description: 'Tam gün spa ve wellness paketi',
      price: 180,
      icon: Sparkles,
      color: 'from-cyan-500 to-blue-600',
      popular: false
    },
    {
      id: 5,
      category: 'activities',
      name: 'Scuba Diving',
      description: 'Rehberli dalış deneyimi',
      price: 120,
      icon: Waves,
      color: 'from-blue-500 to-cyan-600',
      popular: true
    },
    {
      id: 6,
      category: 'activities',
      name: 'Yoga Dersi',
      description: 'Sabah yoga seansı',
      price: 35,
      icon: Dumbbell,
      color: 'from-green-500 to-emerald-600',
      popular: false
    },
    {
      id: 7,
      category: 'services',
      name: 'Fotoğraf Çekimi',
      description: 'Profesyonel tatil fotoğrafları',
      price: 250,
      icon: Camera,
      color: 'from-violet-500 to-purple-600',
      popular: true
    },
    {
      id: 8,
      category: 'services',
      name: 'Havaalanı Transferi',
      description: 'VIP araç ile transfer',
      price: 80,
      icon: ShoppingBag,
      color: 'from-slate-500 to-slate-600',
      popular: false
    }
  ];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const stats = [
    { label: 'Toplam Ürün', value: products.length },
    { label: 'Bu Ay Satış', value: '145' },
    { label: 'Toplam Gelir', value: '$12,450' },
    { label: 'Popüler Ürünler', value: products.filter(p => p.popular).length }
  ];

  return (
    <div data-testid="marketplace-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{fontFamily: 'Plus Jakarta Sans'}}>Marketplace</h1>
          <p className="text-slate-500">Ek hizmetler ve deneyimler mağazası</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Yeni Ürün Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white border-slate-200">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-slate-500 mb-2">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              className={activeCategory === cat.id 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              {cat.name}
            </Button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const Icon = product.icon;
          return (
            <Card key={product.id} data-testid={`product-${product.id}`} className="bg-white border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className={`h-32 bg-gradient-to-br ${product.color} flex items-center justify-center relative`}>
                <Icon className="w-16 h-16 text-white opacity-90" />
                {product.popular && (
                  <Badge className="absolute top-3 right-3 bg-white text-slate-900 border-0 shadow-lg">
                    Popüler
                  </Badge>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-slate-900 mb-2">{product.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Fiyat</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ${product.price}
                    </p>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                    Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Marketplace;
