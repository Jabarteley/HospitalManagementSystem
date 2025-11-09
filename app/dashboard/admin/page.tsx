'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, Users, Calendar, FileText, Pill, CreditCard, Package, Menu, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Button from '@/components/ui/Button'
import AdminLayout from './layout'

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    totalPrescriptions: 0,
    lowStockMedicines: 0,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session.user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      // Fetch all the stats in parallel
      const [patientsRes, doctorsRes, appointmentsRes, prescriptionsRes, inventoryRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/users?role=doctors'),
        fetch('/api/appointments'),
        fetch('/api/prescriptions'),
        fetch('/api/pharmacy/inventory')
      ])

      const patientsData = await patientsRes.json()
      const doctorsData = await doctorsRes.json()
      const appointmentsData = await appointmentsRes.json()
      const prescriptionsData = await prescriptionsRes.json()
      const inventoryData = await inventoryRes.json()

      if (patientsRes.ok && doctorsRes.ok && appointmentsRes.ok && prescriptionsRes.ok && inventoryRes.ok) {
        const pendingAppointments = appointmentsData.appointments.filter(
          (a: any) => a.status === 'pending' || a.status === 'approved'
        ).length
        
        const lowStockMedicines = inventoryData.inventory.filter(
          (m: any) => m.isLowStock
        ).length

        setStats({
          totalPatients: patientsData.patients.length,
          totalDoctors: doctorsData.users.length,
          totalAppointments: appointmentsData.appointments.length,
          pendingAppointments,
          totalPrescriptions: prescriptionsData.prescriptions.length,
          lowStockMedicines,
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
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

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Manage your hospital operations">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {session.user.firstName}!
        </h2>
        <p className="text-gray-600">
          Overview of your hospital operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalPatients}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Doctors</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalDoctors}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalAppointments}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.pendingAppointments}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 text-red-600">
              <FileText className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Prescriptions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalPrescriptions}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <Package className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Low Stock Medicines</p>
              <p className="text-2xl font-semibold text-gray-900 text-red-600">
                {stats.lowStockMedicines}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            size="md"
            className="flex flex-col items-center justify-center p-4"
            onClick={() => router.push('/dashboard/admin/users')}
          >
            <Users className="w-6 h-6 mb-2 text-blue-600" />
            <span>Manage Users</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            className="flex flex-col items-center justify-center p-4"
            onClick={() => router.push('/dashboard/admin/patients')}
          >
            <Users className="w-6 h-6 mb-2 text-blue-600" />
            <span>Manage Patients</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            className="flex flex-col items-center justify-center p-4"
            onClick={() => router.push('/dashboard/admin/appointments')}
          >
            <Calendar className="w-6 h-6 mb-2 text-blue-600" />
            <span>Manage Appointments</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            className="flex flex-col items-center justify-center p-4"
            onClick={() => router.push('/dashboard/admin/pharmacy')}
          >
            <Pill className="w-6 h-6 mb-2 text-blue-600" />
            <span>Manage Pharmacy</span>
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}