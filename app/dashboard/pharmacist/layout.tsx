'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, ReactNode } from 'react'
import { 
  Activity, 
  FileText, 
  Pill, 
  Package, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { signOut } from 'next-auth/react'

interface PharmacistLayoutProps {
  children: ReactNode;
}

const getTitleFromPathname = (pathname: string) => {
  if (pathname === '/dashboard/pharmacist') return 'Dashboard';
  if (pathname.startsWith('/pharmacy/prescriptions')) return 'Prescriptions';
  if (pathname.startsWith('/pharmacy/inventory')) return 'Inventory';
  if (pathname.startsWith('/reports')) return 'Reports';
  const segment = pathname.split('/').pop() || '';
  const title = segment.replace(/-/g, ' ');
  return title.charAt(0).toUpperCase() + title.slice(1);
};

export default function PharmacistDashboardLayout({ children }: PharmacistLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const title = getTitleFromPathname(pathname);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session.user.role !== 'pharmacist') {
      router.push('/dashboard')
    }
  }, [status, router, session])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/pharmacist', icon: LayoutDashboard },
    { name: 'Prescriptions', href: '/pharmacy/prescriptions', icon: Pill },
    { name: 'Inventory', href: '/pharmacy/inventory', icon: Package },
    { name: 'Reports', href: '/reports', icon: FileText },
  ]

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/pharmacist') {
        return pathname === href;
    }
    return pathname.startsWith(href);
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'pharmacist') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <Activity className="h-8 w-8 text-white" />
          <span className="ml-3 text-xl font-bold text-white">Pharmacist Panel</span>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </a>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden text-gray-500 hover:text-gray-600 mr-4"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <span className="sr-only">Open sidebar</span>
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {session.user.firstName} {session.user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {session.user.role}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
