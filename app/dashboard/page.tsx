'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Activity, Calendar, Users, Pill, FileText, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Button from '@/components/ui/Button'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Hospital Management System
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
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
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {session.user.firstName}!
          </h2>
          <p className="text-gray-600">
            {session.user.role === 'admin' && 'Manage your hospital operations from here.'}
            {session.user.role === 'doctor' && 'View your appointments and manage patient records.'}
            {session.user.role === 'patient' && 'Book appointments and view your medical history.'}
            {session.user.role === 'pharmacist' && 'Manage inventory and process prescriptions.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(session.user.role === 'admin' || session.user.role === 'patient') && (
            <DashboardCard
              icon={<Users className="w-8 h-8" />}
              title="Patients"
              description="Manage patient records and profiles"
              href="/patients"
            />
          )}

          <DashboardCard
            icon={<Calendar className="w-8 h-8" />}
            title="Appointments"
            description="Schedule and manage appointments"
            href="/appointments"
          />

          {(session.user.role === 'admin' || session.user.role === 'doctor') && (
            <DashboardCard
              icon={<FileText className="w-8 h-8" />}
              title="Medical Records"
              description="View and update patient records"
              href="/medical-records"
            />
          )}

          {(session.user.role === 'admin' || session.user.role === 'pharmacist') && (
            <DashboardCard
              icon={<Pill className="w-8 h-8" />}
              title="Pharmacy"
              description="Manage inventory and prescriptions"
              href="/pharmacy"
            />
          )}

          {session.user.role === 'admin' && (
            <DashboardCard
              icon={<Users className="w-8 h-8" />}
              title="User Management"
              description="Manage doctors, pharmacists and staff"
              href="/dashboard/admin/users"
            />
          )}
        </div>

        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            System Status: Operational
          </h3>
          <p className="text-blue-700 text-sm">
            All core features are functioning correctly. The backend API and database models are ready for use.
          </p>
        </div>
      </main>
    </div>
  )
}

function DashboardCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <a href={href} className="text-blue-600 hover:underline text-sm font-medium">
        View details →
      </a>
    </div>
  )
}
