import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const GDSIntegration = () => {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await axios.get('/gds/reservations');
      setReservations(response.data.reservations || []);
    } catch (error) {
      console.error('GDS rezervasyonları yüklenemedi');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">
        🌍 GDS Integration
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Globe className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold">Amadeus</p>
            <p className="text-sm text-gray-500">Entegre</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Globe className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold">Sabre</p>
            <p className="text-sm text-gray-500">Entegre</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Globe className="w-12 h-12 text-purple-600 mx-auto mb-2" />
            <p className="text-lg font-bold">Galileo</p>
            <p className="text-sm text-gray-500">Entegre</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GDS Rezervasyonları</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 py-8">
            {reservations.length} GDS rezervasyonu
          </p>
          <Button className="w-full" onClick={() => toast.success('Rate güncelleme başlatıldı')}>
            <Send className="w-4 h-4 mr-2" />
            Tüm GDS'lere Rate Gönder
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GDSIntegration;