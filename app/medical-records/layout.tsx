'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, Calendar, FileText, Pill, Users, LogOut, Menu, X, Home } from 'lucide-react'
import Button from '@/components/ui/Button'
import { signOut } from 'next-auth/react'

export default function MedicalRecordsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  // If not authenticated or not authorized, redirect
  if (!session || !['admin', 'doctor', 'nurse'].includes(session.user.role)) {
    if (typeof window !== 'undefined') {
      router.push('/auth/login')
    }
    return null
  }

  // Navigation items based on user role
  const getNavItems = () => {
    if (session.user.role === 'admin') {
      return [
        { name: 'Dashboard', href: '/dashboard/admin', icon: Home },
        { name: 'Users', href: '/dashboard/admin/users', icon: Users },
        { name: 'Patients', href: '/dashboard/admin/patients', icon: Users },
        { name: 'Appointments', href: '/appointments', icon: Calendar },
        { name: 'Medical Records', href: '/medical-records', icon: FileText },
        { name: 'Prescriptions', href: '/prescriptions', icon: Pill },
        { name: 'Pharmacy', href: '/pharmacy', icon: Pill },
      ]
    } else if (session.user.role === 'doctor') {
      return [
        { name: 'Dashboard', href: '/dashboard/doctor', icon: Home },
        { name: 'Appointments', href: '/appointments', icon: Calendar },
        { name: 'Medical Records', href: '/medical-records', icon: FileText },
        { name: 'Prescriptions', href: '/prescriptions', icon: Pill },
        { name: 'Patients', href: '/patients', icon: Users },
      ]
    } else { // nurse or other roles that can access medical records
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Medical Records', href: '/medical-records', icon: FileText },
      ]
    }
  }

  const navItems = getNavItems()

  // Determine active navigation item based on current path
  const isActive = (path: string) => {
    if (path === '/dashboard/doctor' || path === '/dashboard/admin' || path === '/dashboard') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="md:hidden bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Hospital Management
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className={`hidden md:block fixed inset-y-0 z-30 w-64 bg-white shadow-md ${sidebarOpen ? 'block' : ''}`}>
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">Hospital Management</h1>
            </div>
          </div>
          
          <nav className="p-4 mt-12">
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Navigation</p>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                          isActive(item.href)
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
          
          <div className="absolute bottom-0 w-64 p-4 border-t">
            <div className="flex items-center justify-between">
              <div>
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
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Mobile sidebar */}
        <aside 
          className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white shadow-lg transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out md:hidden`}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">Hospital Management</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="p-4">
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Navigation</p>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                          isActive(item.href)
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
          
          <div className="absolute bottom-0 w-full p-4 border-t">
            <div className="flex items-center justify-between">
              <div>
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
                onClick={() => {
                  signOut({ callbackUrl: '/' })
                  setSidebarOpen(false)
                }}
                className="flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </aside>

        <main className="md:ml-64 flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}