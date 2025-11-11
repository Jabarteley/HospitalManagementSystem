'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Activity, 
  Calendar, 
  FileText, 
  Pill, 
  Users, 
  LogOut, 
  Package, 
  Menu,
  X,
  LayoutDashboard 
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

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

  if (!session) {
    return null
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
        ]
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
        ]
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
            icon: FileText,
            href: '/reports',
          },
        ]
      case 'patient':
        return [
          {
            title: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard/patient',
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
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

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
                  const Icon = item.icon
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-base font-medium rounded-lg ${
                        router.pathname === item.href || 
                        (item.href === '/pharmacy' && router.pathname.includes('/pharmacy')) ||
                        (item.href === '/dashboard/pharmacist' && router.pathname.includes('/dashboard/pharmacist')) ||
                        (item.href === '/dashboard/doctor' && router.pathname.includes('/dashboard/doctor')) ||
                        (item.href === '/dashboard/patient' && router.pathname.includes('/dashboard/patient'))
                          ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        router.push(item.href)
                        setSidebarOpen(false)
                      }}
                    >
                      <Icon className="mr-3 h-6 w-6" />
                      {item.title}
                    </a>
                  )
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
                const Icon = item.icon
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-base font-medium rounded-lg ${
                      router.pathname === item.href || 
                      (item.href === '/pharmacy' && router.pathname?.includes('/pharmacy')) ||
                      (item.href === '/dashboard/pharmacist' && router.pathname?.includes('/dashboard/pharmacist')) ||
                      (item.href === '/dashboard/doctor' && router.pathname?.includes('/dashboard/doctor')) ||
                      (item.href === '/dashboard/patient' && router.pathname?.includes('/dashboard/patient'))
                        ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(item.href)
                    }}
                  >
                    <Icon className="mr-3 h-6 w-6" />
                    {item.title}
                  </a>
                )
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
                  {router.pathname?.includes('/pharmacy') ? 'Pharmacy Management' : 
                   router.pathname?.includes('/dashboard/pharmacist') ? 'Pharmacist Dashboard' :
                   router.pathname?.includes('/dashboard/doctor') ? 'Doctor Dashboard' :
                   router.pathname?.includes('/dashboard/patient') ? 'Patient Dashboard' :
                   'Dashboard'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right mr-4 hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {session.user.firstName} {session.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {session.user.role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:block">Logout</span>
                </button>
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
  )
}