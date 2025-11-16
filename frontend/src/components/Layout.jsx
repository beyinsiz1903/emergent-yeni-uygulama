import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DoorOpen, 
  FileText, 
  Settings,
  Hotel,
  BedDouble,
  TrendingUp,
  Award,
  ShoppingBag,
  Bell
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
    { name: 'RMS', href: '/rms', icon: TrendingUp },
    { name: 'Loyalty', href: '/loyalty', icon: Award },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { name: 'Faturalar', href: '/invoices', icon: FileText },
    { name: 'Ayarlar', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Hotel className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900" style={{fontFamily: 'Plus Jakarta Sans'}}>Hotel Suite</h1>
              <p className="text-xs text-slate-500 font-medium">Premium PMS</p>
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
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">AD</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">Yönetici</p>
            </div>
            <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-slate-400" />
            </button>
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
