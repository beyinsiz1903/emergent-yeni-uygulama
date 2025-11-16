import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Building2, CreditCard, Users, Bell } from 'lucide-react';

const Settings = () => {
  const settingsSections = [
    {
      title: 'Otel Bilgileri',
      description: 'Otel adı, adres ve iletişim bilgilerini yönetin',
      icon: Building2,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Ödeme Ayarları',
      description: 'Ödeme yöntemleri ve Stripe entegrasyonu',
      icon: CreditCard,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Kullanıcılar & Roller',
      description: 'Personel kullanıcılarını ve yetkilerini yönetin',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Bildirimler',
      description: 'E-posta ve SMS bildirim ayarları',
      icon: Bell,
      color: 'from-orange-500 to-orange-600'
    },
  ];

  return (
    <div data-testid="settings-page" className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>Ayarlar</h1>
        <p className="text-gray-400">Sistem ayarlarını yönetin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} data-testid={`setting-${index}`} className="bg-[#16161a] border-[#2a2a2d] hover:border-amber-500/30 transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2" style={{fontFamily: 'Space Grotesk'}}>
                      {section.title}
                    </h3>
                    <p className="text-gray-400 text-sm">{section.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-[#16161a] border-[#2a2a2d]">
        <CardHeader>
          <CardTitle className="text-white" style={{fontFamily: 'Space Grotesk'}}>Kanal Yöneticisi Entegrasyonları</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-4">
            Booking.com, Expedia, Airbnb gibi platformlarla entegre olun.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#1f1f23] border border-[#2a2a2d]">
              <p className="text-white font-medium mb-1">Booking.com</p>
              <p className="text-sm text-gray-400">Entegrasyon bekleniyor</p>
            </div>
            <div className="p-4 rounded-lg bg-[#1f1f23] border border-[#2a2a2d]">
              <p className="text-white font-medium mb-1">Expedia</p>
              <p className="text-sm text-gray-400">Entegrasyon bekleniyor</p>
            </div>
            <div className="p-4 rounded-lg bg-[#1f1f23] border border-[#2a2a2d]">
              <p className="text-white font-medium mb-1">Airbnb</p>
              <p className="text-sm text-gray-400">Entegrasyon bekleniyor</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
