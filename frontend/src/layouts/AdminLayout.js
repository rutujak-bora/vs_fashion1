import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Package, Warehouse, ShoppingBag, FileText, LogOut, Menu, X } from 'lucide-react';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/collections', icon: FolderKanban, label: 'Collections' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/admin/content', icon: FileText, label: 'Content' },
  ];

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-[#8B1B4A]/10 flex flex-col shadow-sm
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="p-6 border-b border-[#8B1B4A]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/vs-fashion-logo.png"
              alt="VS Fashion"
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display', color: '#8B1B4A' }}>
              VS Admin
            </h1>
          </div>
          {/* Close button on mobile */}
          <button
            data-testid="admin-sidebar-close"
            className="lg:hidden text-gray-500 hover:text-[#8B1B4A] transition-colors"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                isActive(item.path, item.exact)
                  ? 'bg-[#8B1B4A] text-white shadow-md'
                  : 'text-gray-700 hover:bg-[#8B1B4A]/5 hover:text-[#8B1B4A]'
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#8B1B4A]/10">
          <Button
            data-testid="admin-logout-btn"
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center gap-2 border-[#8B1B4A] text-[#8B1B4A] hover:bg-[#8B1B4A] hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#8B1B4A]/10 shadow-sm px-4 py-3 flex items-center gap-3">
          <button
            data-testid="admin-sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
            className="text-[#8B1B4A] hover:text-[#6B1238] transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/vs-fashion-logo.png"
              alt="VS Fashion"
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold" style={{ fontFamily: 'Playfair Display', color: '#8B1B4A' }}>
              VS Admin
            </span>
          </div>
        </header>

        <main className="flex-1 bg-gray-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
