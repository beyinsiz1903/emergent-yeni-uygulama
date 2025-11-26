import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const KitchenDisplay = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadOrders();
    if (autoRefresh) {
      const interval = setInterval(loadOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadOrders = async () => {
    try {
      const response = await axios.get('/fnb/kitchen-display');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Orders yüklenemedi');
    }
  };

  const completeOrder = async (orderId) => {
    try {
      await axios.post(`/fnb/kitchen-order/${orderId}/complete`);
      toast.success('✓ Sipariş hazır!');
      loadOrders();
    } catch (error) {
      toast.error('Hata');
    }
  };

  const getElapsedTime = (orderedAt) => {
    const now = new Date();
    const ordered = new Date(orderedAt);
    const diff = Math.floor((now - ordered) / 1000 / 60);
    return diff;
  };

  const getPriorityColor = (priority) => {
    return priority === 'urgent' ? 'from-red-500 to-red-600' :
           priority === 'high' ? 'from-orange-500 to-orange-600' :
           'from-blue-500 to-blue-600';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/20">
              <Home className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">🍳 Kitchen Display</h1>
              <p className="text-sm text-orange-100">Real-time Order Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-orange-100">Aktif Sipariş</p>
              <p className="text-3xl font-bold">{orders.length}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-6 h-6 ${autoRefresh ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
            <p className="text-2xl text-gray-400">Tüm siparişler tamamlandı!</p>
          </div>
        ) : (
          orders.map((order) => {
            const elapsed = getElapsedTime(order.ordered_at);
            const isUrgent = elapsed > 15 || order.priority === 'urgent';
            
            return (
              <Card 
                key={order.id} 
                className={`bg-gradient-to-br ${getPriorityColor(order.priority)} border-4 ${
                  isUrgent ? 'border-red-500 animate-pulse' : 'border-gray-700'
                } transform hover:scale-105 transition-all`}
              >
                <CardContent className="p-6">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-4xl font-bold">#{order.order_number}</p>
                      <p className="text-sm text-white/80">
                        {order.table_number ? `Masa ${order.table_number}` : `Oda ${order.room_number}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <span className="text-3xl font-bold">{elapsed}dk</span>
                      </div>
                      {isUrgent && (
                        <Badge className="mt-1 bg-red-600 text-white border-0">
                          ACİL!
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xl font-bold">{item.quantity}x {item.name}</p>
                            {item.notes && (
                              <p className="text-sm text-yellow-200 mt-1">⚠️ {item.notes}</p>
                            )}
                            {item.modifications && item.modifications.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {item.modifications.map((mod, i) => (
                                  <p key={i} className="text-xs text-orange-200">+ {mod}</p>
                                ))}
                              </div>
                            )}
                          </div>
                          {item.station && (
                            <Badge className="bg-white/20 text-white border-0">
                              {item.station}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Complete Button */}
                  <Button 
                    className="w-full h-16 text-xl font-bold bg-green-600 hover:bg-green-700"
                    onClick={() => completeOrder(order.id)}
                  >
                    ✓ SİPARİŞ HAZIR
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;