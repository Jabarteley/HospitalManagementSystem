'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, Calendar, FileText, Pill, Users, LogOut, Package, Menu, X, LayoutDashboard, BarChart3 } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && !['admin', 'doctor', 'pharmacist'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, router, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !['admin', 'doctor', 'pharmacist'].includes(session.user.role)) {
    return null;
  }

  // Define menu items based on user role
  const getMenuItems = () => {
    switch (session.user.role) {
      case 'admin':
        return [
          {
            title: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
          },
          {
            title: 'Patients',
            icon: Users,
            href: '/patients',
          },
          {
            title: 'Appointments',
            icon: Calendar,
            href: '/appointments',
          },
          {
            title: 'Medical Records',
            icon: FileText,
            href: '/medical-records',
          },
          {
            title: 'Prescriptions',
            icon: Pill,
            href: '/prescriptions',
          },
          {
            title: 'Pharmacy',
            icon: Package,
            href: '/pharmacy',
          },
          {
            title: 'Reports',
            icon: BarChart3,
            href: '/reports',
          },
        ];
      case 'doctor':
        return [
          {
            title: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard/doctor',
          },
          {
            title: 'Appointments',
            icon: Calendar,
            href: '/appointments',
          },
          {
            title: 'Medical Records',
            icon: FileText,
            href: '/medical-records',
          },
          {
            title: 'Prescriptions',
            icon: Pill,
            href: '/prescriptions',
          },
          {
            title: 'Patients',
            icon: Users,
            href: '/patients',
          },
          {
            title: 'Reports',
            icon: BarChart3,
            href: '/reports',
          },
        ];
      case 'pharmacist':
        return [
          {
            title: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard/pharmacist',
          },
          {
            title: 'Prescriptions',
            icon: Pill,
            href: '/pharmacy/prescriptions',
          },
          {
            title: 'Inventory',
            icon: Package,
            href: '/pharmacy/inventory',
          },
          {
            title: 'Reports',
            icon: BarChart3,
            href: '/reports',
          },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900 ml-2">
                    HMS
                  </h1>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-base font-medium rounded-lg ${
                        router.pathname === item.href
                          ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(item.href);
                        setSidebarOpen(false);
                      }}
                    >
                      <Icon className="mr-3 h-6 w-6" />
                      {item.title}
                    </a>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg w-full"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Activity className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 ml-2">
                HMS
              </h1>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-base font-medium rounded-lg ${
                      router.pathname === item.href
                        ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(item.href);
                    }}
                  >
                    <Icon className="mr-3 h-6 w-6" />
                    {item.title}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg w-full"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header with toggle button for mobile sidebar */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <button
                type="button"
                className="md:hidden text-gray-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex-1 px-4 md:px-0">
                <h1 className="text-lg font-semibold text-gray-900">
                  Reports & Analytics
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-8">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}