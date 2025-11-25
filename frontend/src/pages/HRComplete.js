import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Clock, Calendar, DollarSign, Briefcase, UserPlus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const HRComplete = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('attendance');

  const clockIn = async (staffId) => {
    try {
      await axios.post('/hr/clock-in', { staff_id: staffId });
      toast.success('Clock-in kaydedildi!');
    } catch (error) {
      toast.error('Hata');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <Home className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">👥 HR Management Suite</h1>
            <p className="text-gray-600">Time & Attendance, Payroll, Leave, Recruitment</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="attendance">
            <Clock className="w-4 h-4 mr-2" />Attendance
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <DollarSign className="w-4 h-4 mr-2" />Payroll
          </TabsTrigger>
          <TabsTrigger value="leave">
            <Calendar className="w-4 h-4 mr-2" />Leave
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Briefcase className="w-4 h-4 mr-2" />Performance
          </TabsTrigger>
          <TabsTrigger value="recruitment">
            <UserPlus className="w-4 h-4 mr-2" />Recruitment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardHeader><CardTitle>Time & Attendance</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-700 mb-4">Dijital clock in/out sistemi</p>
                <Button onClick={() => clockIn('test-staff-id')} className="bg-green-600">
                  ⏱️ Clock In Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader><CardTitle>Payroll Management</CardTitle></CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 py-8">Otomatik payroll hesaplama sistemi hazır</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader><CardTitle>Leave Management</CardTitle></CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 py-8">Leave request ve approval sistemi</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader><CardTitle>Performance Management</CardTitle></CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 py-8">KPI tracking, goal setting, 360 feedback</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recruitment">
          <Card>
            <CardHeader><CardTitle>Recruitment & Onboarding</CardTitle></CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 py-8">Job posting, applicant tracking, onboarding workflow</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRComplete;