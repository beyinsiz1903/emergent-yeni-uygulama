import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Building
} from 'lucide-react';

const Reports = ({ user, tenant, onLogout }) => {
  const [loading, setLoading] = useState(false);

  const reportCategories = [
    {
      title: 'Financial Reports',
      icon: DollarSign,
      reports: [
        { name: 'Daily Flash Report', endpoint: '/reports/daily-flash', type: 'pdf' },
        { name: 'Revenue Report', endpoint: '/reports/revenue', type: 'pdf' },
        { name: 'Company Aging Report', endpoint: '/reports/company-aging', type: 'pdf' },
        { name: 'Finance Snapshot', endpoint: '/reports/finance-snapshot', type: 'pdf' }
      ]
    },
    {
      title: 'Operational Reports',
      icon: Building,
      reports: [
        { name: 'Occupancy Report', endpoint: '/reports/occupancy', type: 'pdf' },
        { name: 'Daily Summary', endpoint: '/reports/daily-summary', type: 'pdf' },
        { name: 'Housekeeping Efficiency', endpoint: '/reports/housekeeping-efficiency', type: 'pdf' }
      ]
    },
    {
      title: 'Market Reports',
      icon: TrendingUp,
      reports: [
        { name: 'Market Segment Analysis', endpoint: '/reports/market-segment', type: 'pdf' },
        { name: 'Forecast Report', endpoint: '/reports/forecast', type: 'pdf' },
        { name: 'GM Dashboard Forecast', endpoint: '/dashboard/gm-forecast', type: 'json' }
      ]
    }
  ];

  const handleDownloadReport = async (report) => {
    setLoading(true);
    try {
      // This is a placeholder - actual implementation would fetch the report
      console.log(`Downloading report: ${report.name}`);
      // You can implement the actual download logic here
    } catch (error) {
      console.error('Failed to download report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user} tenant={tenant} onLogout={onLogout} currentModule="reports">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Generate and download hotel management reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {reportCategories.map((category, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="w-5 h-5 text-blue-600" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.reports.map((report, reportIdx) => (
                    <div 
                      key={reportIdx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {report.name}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadReport(report)}
                        disabled={loading}
                        className="h-8"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">
              Configure automatic report generation and email delivery
            </p>
            <Button className="mt-4" variant="outline">
              Configure Schedule
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
