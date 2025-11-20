import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Building,
  FileSpreadsheet,
  Plus,
  X,
  Trash2
} from 'lucide-react';

const Reports = ({ user, tenant, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [showSelector, setShowSelector] = useState(false);

  // All available reports
  const availableReports = [
    {
      id: 'daily-flash',
      name: 'Daily Flash Report',
      category: 'Financial',
      icon: DollarSign,
      endpoint: '/reports/daily-flash/excel',
      needsDateRange: false,
      description: 'Daily occupancy, revenue, and key metrics'
    },
    {
      id: 'company-aging',
      name: 'Company Aging Report',
      category: 'Financial',
      icon: DollarSign,
      endpoint: '/reports/company-aging/excel',
      needsDateRange: false,
      description: 'Accounts receivable aging by company'
    },
    {
      id: 'housekeeping-efficiency',
      name: 'Housekeeping Efficiency',
      category: 'Operational',
      icon: Building,
      endpoint: '/reports/housekeeping-efficiency/excel',
      needsDateRange: true,
      description: 'Staff performance and task completion'
    },
    {
      id: 'market-segment',
      name: 'Market Segment Analysis',
      category: 'Market',
      icon: TrendingUp,
      endpoint: '/reports/market-segment/excel',
      needsDateRange: true,
      description: 'Revenue by market segment and rate type'
    }
  ];

  const addReport = (reportId) => {
    const report = availableReports.find(r => r.id === reportId);
    if (report && !selectedReports.find(r => r.id === reportId)) {
      setSelectedReports([...selectedReports, {
        ...report,
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }]);
    }
    setShowSelector(false);
  };

  const removeReport = (reportId) => {
    setSelectedReports(selectedReports.filter(r => r.id !== reportId));
  };

  const updateReportDate = (reportId, field, value) => {
    setSelectedReports(selectedReports.map(r => 
      r.id === reportId ? { ...r, [field]: value } : r
    ));
  };

  const handleDownloadReport = async (report) => {
    setLoading(true);
    try {
      let url = report.endpoint;
      
      // Add date parameters if needed
      if (report.needsParams) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      
      const response = await axios.get(url, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${report.name.replace(/\s+/g, '_')}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`${report.name} downloaded successfully!`);
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user} tenant={tenant} onLogout={onLogout} currentModule="reports">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <FileSpreadsheet className="inline-block w-8 h-8 mr-2 text-green-600" />
            Reports - Excel Export
          </h1>
          <p className="text-gray-600">Download comprehensive reports in Excel format</p>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Date Range (for reports that need dates)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700 block">
                            {report.name}
                          </span>
                          {report.hasDateRange && (
                            <span className="text-xs text-gray-500">
                              Requires date range
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleDownloadReport(report)}
                        disabled={loading}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Excel
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
