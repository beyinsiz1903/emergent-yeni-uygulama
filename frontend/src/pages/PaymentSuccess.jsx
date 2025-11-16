import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    }
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await api.get(`/payments/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        return;
      } else if (response.data.status === 'expired') {
        setStatus('expired');
        return;
      }

      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };

  return (
    <div data-testid="payment-success-page" className="flex items-center justify-center min-h-[60vh]">
      <Card className="bg-[#16161a] border-[#2a2a2d] w-full max-w-md">
        <CardContent className="p-12 text-center">
          {status === 'checking' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>
                Ödeme kontrol ediliyor...
              </h2>
              <p className="text-gray-400">Lütfen bekleyin</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>
                Ödeme Başarılı!
              </h2>
              <p className="text-gray-400 mb-6">Ödemeniz başarıyla alındı.</p>
              <Button 
                onClick={() => navigate('/reservations')}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                data-testid="go-to-reservations-btn"
              >
                Rezervasyonlara Dön
              </Button>
            </>
          )}

          {(status === 'error' || status === 'timeout' || status === 'expired') && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>
                Ödeme Başarısız
              </h2>
              <p className="text-gray-400 mb-6">
                {status === 'timeout' ? 'Ödeme kontrolü zaman aşımına uğradı.' : 'Ödeme işlemi başarısız oldu.'}
              </p>
              <Button 
                onClick={() => navigate('/reservations')}
                variant="outline"
                className="border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23]"
              >
                Geri Dön
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
