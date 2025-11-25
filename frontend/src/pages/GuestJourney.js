import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile, Meh, Frown, TrendingUp } from 'lucide-react';

const GuestJourney = () => {
  const [npsData, setNpsData] = useState(null);

  useEffect(() => {
    loadNPS();
  }, []);

  const loadNPS = async () => {
    try {
      const response = await axios.get('/nps/score?days=30');
      setNpsData(response.data);
    } catch (error) {
      console.error('NPS yüklenemedi');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">
        🛤️ Guest Journey & NPS
      </h1>

      {npsData && (
        <>
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="pt-8 text-center">
              <p className="text-sm text-gray-600 mb-2">Net Promoter Score</p>
              <p className="text-6xl font-bold text-green-600">{npsData.nps_score}</p>
              <p className="text-sm text-gray-600 mt-2">
                {npsData.total_responses} yanıt (Son 30 gün)
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Smile className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold">{npsData.promoters}</p>
                <p className="text-sm text-gray-500">Promoters (9-10)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Meh className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                <p className="text-3xl font-bold">{npsData.passives}</p>
                <p className="text-sm text-gray-500">Passives (7-8)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Frown className="w-12 h-12 text-red-600 mx-auto mb-2" />
                <p className="text-3xl font-bold">{npsData.detractors}</p>
                <p className="text-sm text-gray-500">Detractors (0-6)</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default GuestJourney;