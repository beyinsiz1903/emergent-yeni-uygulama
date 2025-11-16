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
  Globe,
  User
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'PMS', href: '/reservations', icon: Hotel },
    { name: 'Channel Manager', href: '/channels', icon: Globe },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'RMS', href: '/rms', icon: TrendingUp },
    { name: 'Loyalty', href: '/loyalty', icon: Award },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Hotel Name */}
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="text-2xl font-bold text-blue-600">RoomOps</div>
              </Link>
              <div className="text-sm text-gray-600">Grand Canyon Hotel</div>
            </div>

            {/* Main Navigation */}
            <nav className="flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href) || 
                  (item.href === '/dashboard' && location.pathname === '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                    className={
                      `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side - Language & User */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                <Globe className="w-4 h-4" />
                <span>English</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span>Hotel Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
