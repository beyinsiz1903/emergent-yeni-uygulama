import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingBag, Utensils, Dumbbell, Waves, Sparkles, Coffee, Wine, Camera, Package, AlertTriangle, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Marketplace = () => {
  const [activeCategory, setActiveCategory] = useState('guest-services');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const categories = [
    { id: 'guest-services', name: 'Guest Services', icon: ShoppingBag },
    { id: 'dining', name: 'Yeme & İçme', icon: Utensils },
    { id: 'wellness', name: 'Wellness & Spa', icon: Sparkles },
    { id: 'activities', name: 'Aktiviteler', icon: Waves },
    { id: 'hotel-supplies', name: 'Hotel Supplies', icon: Package }
  ];

  const guestProducts = [
    {
      id: 1,
      category: 'dining',
      name: 'Romantik Akşam Yemeği',
      description: 'Sahilde özel masa, 3 kurs menü',
      price: 150,
      icon: Wine,
      color: 'from-rose-500 to-pink-600',
      popular: true,
      type: 'guest'
    },
    {
      id: 2,
      category: 'dining',
      name: 'Kahvaltı Paketi',
      description: 'Odaya özel kahvaltı servisi',
      price: 45,
      icon: Coffee,
      color: 'from-amber-500 to-orange-600',
      popular: false,
      type: 'guest'
    },
    {
      id: 3,
      category: 'wellness',
      name: 'Çiftler Masajı',
      description: '60 dakika rahatlatıcı masaj',
      price: 200,
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-600',
      popular: true,
      type: 'guest'
    },
    {
      id: 4,
      category: 'wellness',
      name: 'Spa Günü',
      description: 'Tam gün spa ve wellness paketi',
      price: 180,
      icon: Sparkles,
      color: 'from-cyan-500 to-blue-600',
      popular: false,
      type: 'guest'
    },
    {
      id: 5,
      category: 'activities',
      name: 'Scuba Diving',
      description: 'Rehberli dalış deneyimi',
      price: 120,
      icon: Waves,
      color: 'from-blue-500 to-cyan-600',
      popular: true,
      type: 'guest'
    },
    {
      id: 6,
      category: 'activities',
      name: 'Yoga Dersi',
      description: 'Sabah yoga seansı',
      price: 35,
      icon: Dumbbell,
      color: 'from-green-500 to-emerald-600',
      popular: false,
      type: 'guest'
    },
    {
      id: 7,
      category: 'guest-services',
      name: 'Fotoğraf Çekimi',
      description: 'Profesyonel tatil fotoğrafları',
      price: 250,
      icon: Camera,
      color: 'from-violet-500 to-purple-600',
      popular: true,
      type: 'guest'
    },
    {
      id: 8,
      category: 'guest-services',
      name: 'Havaalanı Transferi',
      description: 'VIP araç ile transfer',
      price: 80,
      icon: ShoppingBag,
      color: 'from-slate-500 to-slate-600',
      popular: false,
      type: 'guest'
    }
  ];

  const hotelSupplies = [
    {
      id: 101,
      category: 'hotel-supplies',
      name: 'Şampuan (500ml)',
      description: 'Premium otel şampuanı',
      price: 3.5,
      unit: 'adet',
      currentStock: 45,
      minStock: 100,
      needsReorder: true,
      icon: Package,
      color: 'from-blue-400 to-blue-500',
      type: 'supply'
    },
    {
      id: 102,
      category: 'hotel-supplies',
      name: 'Terlik (Tek Kullanımlık)',
      description: 'Beyaz spa terliği',
      price: 1.2,
      unit: 'çift',
      currentStock: 180,
      minStock: 200,
      needsReorder: true,
      icon: Package,
      color: 'from-green-400 to-green-500',
      type: 'supply'
    },
    {
      id: 103,
      category: 'hotel-supplies',
      name: 'Havlu Seti',
      description: 'Yüz + El + Banyo havlusu',
      price: 12,
      unit: 'set',
      currentStock: 250,
      minStock: 150,
      needsReorder: false,
      icon: Package,
      color: 'from-purple-400 to-purple-500',
      type: 'supply'
    },
    {
      id: 104,
      category: 'hotel-supplies',
      name: 'Diş Fırçası Seti',
      description: 'Diş fırçası + macun',
      price: 0.8,
      unit: 'set',
      currentStock: 35,
      minStock: 100,
      needsReorder: true,
      icon: Package,
      color: 'from-cyan-400 to-cyan-500',
      type: 'supply'
    },
    {
      id: 105,
      category: 'hotel-supplies',
      name: 'Sabun (100g)',
      description: 'Doğal zeytinyalı sabun',
      price: 1.5,
      unit: 'adet',
      currentStock: 80,
      minStock: 150,
      needsReorder: true,
      icon: Package,
      color: 'from-amber-400 to-amber-500',
      type: 'supply'
    },
    {
      id: 106,
      category: 'hotel-supplies',
      name: 'Çarşaf Takımı',
      description: 'Beyaz pamuklu çarşaf seti',
      price: 25,
      unit: 'takım',
      currentStock: 120,
      minStock: 100,
      needsReorder: false,
      icon: Package,
      color: 'from-indigo-400 to-indigo-500',
      type: 'supply'
    },
    {
      id: 107,
      category: 'hotel-supplies',
      name: 'Yüz Peçetesi',
      description: 'Tek kullanımlık yüz peçetesi paketi',
      price: 2.5,
      unit: 'paket',
      currentStock: 25,
      minStock: 80,
      needsReorder: true,
      icon: Package,
      color: 'from-rose-400 to-rose-500',
      type: 'supply'
    },
    {
      id: 108,
      category: 'hotel-supplies',
      name: 'Bornoz',
      description: 'Premium otel bornozu',
      price: 35,
      unit: 'adet',
      currentStock: 95,
      minStock: 100,
      needsReorder: true,
      icon: Package,
      color: 'from-violet-400 to-violet-500',
      type: 'supply'
    }
  ];

  const allProducts = [...guestProducts, ...hotelSupplies];
  const filteredProducts = activeCategory === 'hotel-supplies'
    ? hotelSupplies
    : allProducts.filter(p => p.category === activeCategory || activeCategory === 'guest-services');

  const needsReorderCount = hotelSupplies.filter(s => s.needsReorder).length;
  const totalSupplyValue = hotelSupplies.reduce((sum, s) => sum + (s.currentStock * s.price), 0);

  const stats = [
    { label: 'Guest Sales (Month)', value: '$12,450', icon: DollarSign, color: 'text-green-600' },
    { label: 'Total Products', value: allProducts.length, icon: Package, color: 'text-blue-600' },
    { label: 'Supply Value', value: `$${totalSupplyValue.toFixed(0)}`, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Needs Reorder', value: needsReorderCount, icon: AlertTriangle, color: 'text-orange-600' }
  ];

  const handleOrder = (item) => {
    setSelectedItem(item);
    setOrderDialogOpen(true);
  };

  const placeOrder = (quantity) => {
    toast.success(`${quantity} ${selectedItem.unit} ${selectedItem.name} siparişi verildi!`);
    setOrderDialogOpen(false);
  };

  return (
    <div data-testid="marketplace-page" className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Marketplace</h1>
          <p className="text-lg text-gray-600">Guest services & hotel supplies management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                  {stat.label === 'Needs Reorder' && stat.value > 0 && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                      Alert
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Low Stock Alerts */}
      {needsReorderCount > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">{needsReorderCount} items need reordering</p>
                <p className="text-sm text-orange-700">Stock levels are below minimum threshold</p>
              </div>
              <Button 
                onClick={() => setActiveCategory('hotel-supplies')} 
                className="ml-auto bg-orange-600 hover:bg-orange-700 text-white"
              >
                View Supplies
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                ? 'bg-black hover:bg-gray-800 text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              {cat.name}
              {cat.id === 'hotel-supplies' && needsReorderCount > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">{needsReorderCount}</Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const Icon = product.icon;
          const isSupply = product.type === 'supply';
          
          return (
            <Card key={product.id} data-testid={`product-${product.id}`} className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
              <div className={`h-32 bg-gradient-to-br ${product.color} flex items-center justify-center relative`}>
                <Icon className="w-16 h-16 text-white opacity-90" />
                {product.popular && (
                  <Badge className="absolute top-3 right-3 bg-white text-gray-900 border-0 shadow-lg">
                    Popüler
                  </Badge>
                )}
                {isSupply && product.needsReorder && (
                  <Badge className="absolute top-3 right-3 bg-orange-500 text-white border-0 shadow-lg">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Low Stock
                  </Badge>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                
                {isSupply ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Stock:</span>
                      <span className={`font-semibold ${
                        product.currentStock < product.minStock ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {product.currentStock} {product.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Min Stock:</span>
                      <span className="font-semibold text-gray-900">{product.minStock} {product.unit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Unit Price</p>
                        <p className="text-xl font-bold text-gray-900">${product.price}</p>
                      </div>
                      <Button 
                        onClick={() => handleOrder(product)}
                        size="sm" 
                        className={product.needsReorder 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'bg-black hover:bg-gray-800 text-white'
                        }
                      >
                        Order
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Price</p>
                      <p className="text-2xl font-bold text-gray-900">${product.price}</p>
                    </div>
                    <Button size="sm" className="bg-black hover:bg-gray-800 text-white">
                      Add to Folio
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Place Supply Order</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{selectedItem.name}</h3>
                <p className="text-sm text-gray-600">{selectedItem.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Current Stock</p>
                  <p className="font-semibold text-gray-900">{selectedItem.currentStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Min Stock</p>
                  <p className="font-semibold text-gray-900">{selectedItem.minStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Unit Price</p>
                  <p className="font-semibold text-gray-900">${selectedItem.price}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Recommended Order</p>
                  <p className="font-semibold text-orange-600">
                    {selectedItem.minStock - selectedItem.currentStock + 50} {selectedItem.unit}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Order Quantity</label>
                <Input 
                  type="number" 
                  defaultValue={selectedItem.minStock - selectedItem.currentStock + 50}
                  className="border-gray-300"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setOrderDialogOpen(false)} 
                  variant="outline" 
                  className="flex-1 border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => placeOrder(selectedItem.minStock - selectedItem.currentStock + 50)} 
                  className="flex-1 bg-black hover:bg-gray-800 text-white"
                >
                  Place Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
