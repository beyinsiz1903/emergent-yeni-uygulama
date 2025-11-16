import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Faturalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      partial: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      refunded: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || colors.pending;
  };

  const getPaymentStatusText = (status) => {
    const text = {
      pending: 'Beklemede',
      paid: 'Ödendi',
      partial: 'Kısmi Ödeme',
      refunded: 'İade',
    };
    return text[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div data-testid="invoices-page" className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Faturalar</h1>
        <p className="text-gray-400">Tüm faturası görüntüleyin</p>
      </div>

      <div className="grid gap-4">
        {invoices.length === 0 ? (
          <Card className="bg-[#16161a] border-[#2a2a2d]">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Henüz fatura bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id} data-testid={`invoice-${invoice.id}`} className="bg-[#16161a] border-[#2a2a2d] hover:border-amber-500/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-white">{invoice.invoice_number}</h3>
                        <Badge className={getPaymentStatusColor(invoice.payment_status)}>
                          {getPaymentStatusText(invoice.payment_status)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Ara Toplam</p>
                          <p className="text-white font-medium">${invoice.total_amount}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Vergi</p>
                          <p className="text-white font-medium">${invoice.tax_amount}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Toplam</p>
                          <p className="text-white font-medium">${invoice.final_amount}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Tarihi</p>
                          <p className="text-white font-medium">
                            {new Date(invoice.issued_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    data-testid={`view-invoice-${invoice.id}`}
                    variant="outline" 
                    className="border-[#2a2a2d] text-gray-400 hover:text-white hover:bg-[#1f1f23]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Detay
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Invoices;
