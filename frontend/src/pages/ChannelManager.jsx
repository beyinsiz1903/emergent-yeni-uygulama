import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, CheckCircle, TrendingUp, DollarSign, Plus } from 'lucide-react';

const ChannelManager = () => {
  const [activeTab, setActiveTab] = useState('connections');

  const stats = [
    { label: 'Total Channels', value: 0, icon: Globe, color: 'text-blue-600' },
    { label: 'Active Channels', value: 0, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Bookings This Month', value: 0, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Revenue This Month', value: '$0', icon: DollarSign, color: 'text-orange-600' }
  ];

  const tabs = [
    { id: 'connections', label: 'Connections' },
    { id: 'bulk-update', label: 'Bulk Update' },
    { id: 'room-mappings', label: 'Room Mappings' },
    { id: 'sync-logs', label: 'Sync Logs' }
  ];

  return (
    <div data-testid="channel-manager-page" className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Channel Manager</h1>
        <p className="text-lg text-gray-600">Manage all your booking channels from a single point</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'text-gray-900 border-b-2 border-black'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Channel Connections */}
      {activeTab === 'connections' && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">Channel Connections</CardTitle>
              <Button className="bg-black hover:bg-gray-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Channel
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Manage your booking channel connections</p>
          </CardHeader>
          <CardContent className="p-12">
            <div className="text-center text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No channels added yet</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChannelManager;
