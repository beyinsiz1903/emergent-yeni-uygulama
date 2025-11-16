import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DoorOpen, 
  FileText, 
  Settings,
  Hotel,
  BedDouble
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Rezervasyonlar', href: '/reservations', icon: DoorOpen },
    { name: 'Takvim', href: '/calendar', icon: Calendar },
    { name: 'Misafirler', href: '/guests', icon: Users },
    { name: 'Odalar', href: '/rooms', icon: Hotel },
    { name: 'Oda Tipleri', href: '/room-types', icon: BedDouble },
    { name: 'Faturalar', href: '/invoices', icon: FileText },
    { name: 'Ayarlar', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0f0f10] to-[#1a1a1d]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#16161a] border-r border-[#2a2a2d] flex flex-col">
        <div className="p-6 border-b border-[#2a2a2d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Hotel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white" style={{fontFamily: 'Space Grotesk'}}>Hotel Suite</h1>
              <p className="text-xs text-gray-400">Premium PMS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                className={
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-[#1f1f23]'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2a2a2d]">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1f1f23]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">AD</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-gray-400">Yönetici</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
