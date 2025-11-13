'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AdminDashboardLayout from '../dashboard/admin/layout'
import DoctorDashboardLayout from '../dashboard/doctor/layout'
import PatientDashboardLayout from '../dashboard/patient/layout'
import { Activity } from 'lucide-react'

export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
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
        <Activity className="w-12 h-12 text-blue-600 animate-pulse" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const role = session.user.role

  if (role === 'admin') {
    return <AdminDashboardLayout>{children}</AdminDashboardLayout>
  }
  if (role === 'doctor') {
    return <DoctorDashboardLayout>{children}</DoctorDashboardLayout>
  }
  if (role === 'patient') {
    return <PatientDashboardLayout>{children}</PatientDashboardLayout>
  }

  // Fallback for other roles (like nurse) or if something goes wrong
  return <>{children}</>
}
