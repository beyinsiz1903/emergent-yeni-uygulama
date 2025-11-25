import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Calendar, Users } from 'lucide-react';

const SpaWellness = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await axios.get('/spa/appointments');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      toast.error('Randevular yüklenemedi');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">
        🧘 Spa & Wellness Yönetimi
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Spa Randevuları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Spa randevu sistemi hazır</p>
            <p className="text-sm text-gray-500 mt-2">Toplam {appointments.length} randevu</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpaWellness;