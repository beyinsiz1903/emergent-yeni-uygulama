import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users } from 'lucide-react';

const MeetingEvents = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await axios.get('/events/bookings');
      setEvents(response.data.events || []);
    } catch (error) {
      toast.error('Etkinlikler yüklenemedi');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">
        🏛️ Meeting & Events
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Etkinlik Rezervasyonları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Etkinlik yönetim sistemi hazır</p>
            <p className="text-sm text-gray-500 mt-2">Toplam {events.length} etkinlik</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingEvents;