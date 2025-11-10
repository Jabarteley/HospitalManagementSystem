'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Users, Calendar, FileText, Package, Pill, CreditCard, Activity } from 'lucide-react'
import Button from '@/components/ui/Button'

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
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'admin') fetchStats()
  }, [session])

  const fetchStats = async () => {
    try {
      const [patientsRes, usersRes, appointmentsRes, prescriptionsRes, inventoryRes] =
        await Promise.all([
          fetch('/api/patients', { cache: 'no-store' }),
          fetch('/api/users'), // Fetch all users instead of just doctors
          fetch('/api/appointments'),
          fetch('/api/prescriptions'),
          fetch('/api/pharmacy/inventory'),
        ])

      const patientsData = await patientsRes.json()
      const usersData = await usersRes.json()
      const appointmentsData = await appointmentsRes.json()
      const prescriptionsData = await prescriptionsRes.json()
      const inventoryData = await inventoryRes.json()

      const pendingAppointments = appointmentsData.appointments.filter(
        (a: any) => a.status === 'pending' || a.status === 'approved'
      ).length

      const lowStockMedicines = inventoryData.inventory.filter(
        (m: any) => m.isLowStock
      ).length

      // Count doctors from all users
      const doctorsCount = usersData.users ? usersData.users.filter((u: any) => u.role === 'doctor').length : 0

      setStats({
        totalPatients: patientsData.patients ? patientsData.patients.length : 0,
        totalDoctors: doctorsCount,
        totalAppointments: appointmentsData.appointments.length,
        pendingAppointments,
        totalPrescriptions: prescriptionsData.prescriptions.length,
        lowStockMedicines,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (!session || session.user.role !== 'admin') return null

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {session.user.firstName}!
        </h2>
        <p className="text-gray-600">Overview of your hospital operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Patients */}
        <StatCard label="Total Patients" value={stats.totalPatients} icon={Users} />
        {/* Total Doctors */}
        <StatCard label="Total Doctors" value={stats.totalDoctors} icon={Users} badgeColor="bg-green-100 text-green-600" />
        {/* Total Appointments */}
        <StatCard label="Total Appointments" value={stats.totalAppointments} icon={Calendar} badgeColor="bg-yellow-100 text-yellow-600" />
        {/* Pending Appointments */}
        <StatCard label="Pending Appointments" value={stats.pendingAppointments} icon={Calendar} badgeColor="bg-purple-100 text-purple-600" />
        {/* Total Prescriptions */}
        <StatCard label="Total Prescriptions" value={stats.totalPrescriptions} icon={FileText} badgeColor="bg-red-100 text-red-600" />
        {/* Low Stock Medicines */}
        <StatCard label="Low Stock Medicines" value={stats.lowStockMedicines} icon={Package} badgeColor="bg-orange-100 text-orange-600" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/dashboard/admin/users')}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-6 h-6 mb-2 text-blue-600" />
            <span className="text-sm">Manage Users</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/admin/patients')}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-6 h-6 mb-2 text-blue-600" />
            <span className="text-sm">Manage Patients</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/admin/appointments')}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-6 h-6 mb-2 text-blue-600" />
            <span className="text-sm">Manage Appointments</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/admin/medical-records')}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-6 h-6 mb-2 text-blue-600" />
            <span className="text-sm">Manage Records</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/admin/prescriptions')}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-6 h-6 mb-2 text-blue-600" />
            <span className="text-sm">Manage Prescriptions</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/admin/pharmacy')}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pill className="w-6 h-6 mb-2 text-blue-600" />
            <span className="text-sm">Manage Pharmacy</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/admin/billing')}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="w-6 h-6 mb-2 text-blue-600" />
            <span className="text-sm">Manage Billing</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/admin/audit-logs')}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="w-6 h-6 mb-2 text-blue-600" />
            <span className="text-sm">View Logs</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Reusable Stat Card Component
function StatCard({ label, value, icon: Icon, badgeColor = "bg-blue-100 text-blue-600" }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${badgeColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
