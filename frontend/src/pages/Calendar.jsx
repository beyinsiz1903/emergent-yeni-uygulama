import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Calendar = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth]);

  const fetchAvailability = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      const response = await api.get(`/calendar/availability?start_date=${startDate}&end_date=${endDate}`);
      setAvailability(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Müsaitlik bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newDate);
    setLoading(true);
  };

  const monthName = currentMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div data-testid="calendar-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Oda Takvimi</h1>
          <p className="text-gray-400">Müsaitlik ve fiyat bilgileri</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigateMonth(-1)}
            variant="outline"
            className="border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23]"
            data-testid="prev-month-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-white font-medium min-w-[200px] text-center" style={{fontFamily: 'Space Grotesk'}}>
            {monthName}
          </span>
          <Button 
            onClick={() => navigateMonth(1)}
            variant="outline"
            className="border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23]"
            data-testid="next-month-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {availability.map((roomTypeData) => (
          <Card key={roomTypeData.room_type_id} data-testid={`calendar-${roomTypeData.room_type_id}`} className="bg-[#16161a] border-[#2a2a2d]">
            <CardHeader>
              <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>{roomTypeData.room_type_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-400 p-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {roomTypeData.dates.map((dateInfo, index) => {
                      const date = new Date(dateInfo.date);
                      const dayOfWeek = date.getDay();
                      const isToday = dateInfo.date === new Date().toISOString().split('T')[0];
                      const availabilityPercent = dateInfo.total > 0 ? (dateInfo.available / dateInfo.total) * 100 : 0;
                      
                      let bgColor = 'bg-green-500/20 border-green-500/30';
                      if (availabilityPercent === 0) {
                        bgColor = 'bg-red-500/20 border-red-500/30';
                      } else if (availabilityPercent < 30) {
                        bgColor = 'bg-orange-500/20 border-orange-500/30';
                      } else if (availabilityPercent < 60) {
                        bgColor = 'bg-yellow-500/20 border-yellow-500/30';
                      }
                      
                      return (
                        <div
                          key={dateInfo.date}
                          data-testid={`calendar-day-${dateInfo.date}`}
                          className={`p-3 rounded-lg border ${bgColor} ${isToday ? 'ring-2 ring-amber-500' : ''} transition-all hover:scale-105`}
                        >
                          <div className="text-center">
                            <div className="text-sm font-semibold text-white mb-1">
                              {date.getDate()}
                            </div>
                            <div className="text-xs text-gray-300 mb-1">
                              ${dateInfo.rate}
                            </div>
                            <div className="text-xs">
                              <span className={availabilityPercent > 0 ? 'text-green-400' : 'text-red-400'}>
                                {dateInfo.available}/{dateInfo.total}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#16161a] border-[#2a2a2d]">
        <CardHeader>
          <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Renk Anahtarı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
              <span className="text-sm text-gray-300">%60+ Müsait</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
              <span className="text-sm text-gray-300">%30-60 Müsait</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/30"></div>
              <span className="text-sm text-gray-300">%0-30 Müsait</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
              <span className="text-sm text-gray-300">Dolu</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;
