import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import {
  House,
  Target,
  CalendarPlus,
  Calculator,
  ChartBar,
  ChartPie,
  Gear,
  Users,
  SignOut,
  List,
  X,
  Coins,
  UserCircle
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_fund-tracker-153/artifacts/q246pqjs_umee%20logo.jpg';

const DashboardLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: House },
    { name: 'Campaigns', href: '/campaigns', icon: Target },
    { name: 'Daily Entries', href: '/daily-entries', icon: CalendarPlus },
    { name: 'Monthly Settlements', href: '/monthly-settlements', icon: Calculator, adminOnly: true },
    { name: 'Reports', href: '/reports', icon: ChartBar },
    { name: 'Monthly Reports', href: '/monthly-reports', icon: ChartPie },
    { name: 'Stakeholder Earnings', href: '/stakeholder-earnings', icon: Coins },
  ];

  const adminNavigation = [
    { name: 'Settings', href: '/settings', icon: Gear },
    { name: 'User Management', href: '/users', icon: Users },
  ];

  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  const NavItem = ({ item }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    
    if (item.adminOnly && !isAdmin) return null;
    
    return (
      <Link
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-[#6AAF35] text-white'
            : 'text-[#44403C] hover:bg-stone-100'
        }`}
        data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Icon size={20} weight={active ? 'fill' : 'regular'} />
        {item.name}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-stone-200">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Umeed Now" className="h-10 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {isAdmin && (
          <>
            <Separator className="my-4" />
            <p className="px-3 text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-2">
              Admin
            </p>
            <nav className="space-y-1">
              {adminNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </>
        )}
      </ScrollArea>

      {/* User section */}
      <div className="p-4 border-t border-stone-200">
        <Link 
          to="/profile" 
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 mb-3 p-2 -mx-2 rounded-lg hover:bg-stone-100 transition-colors"
          data-testid="nav-profile"
        >
          <div className="w-10 h-10 rounded-full bg-[#6AAF35] flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1C1917] truncate">{user?.name}</p>
            <p className="text-xs text-[#78716C] truncate">{user?.email}</p>
          </div>
          <UserCircle size={20} className="text-[#78716C]" />
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={logout}
          data-testid="logout-button"
        >
          <SignOut size={18} />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Umeed Now" className="h-8 w-auto" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-testid="mobile-menu-toggle"
        >
          {sidebarOpen ? <X size={24} /> : <List size={24} />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-stone-50 border-r border-stone-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
