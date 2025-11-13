'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PatientDashboardLayout from '../dashboard/patient/layout'
import PharmacistDashboardLayout from '../dashboard/pharmacist/layout'
import AdminDashboardLayout from '../dashboard/admin/layout'
import { Activity } from 'lucide-react'

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
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

  if (role === 'patient') {
    return <PatientDashboardLayout>{children}</PatientDashboardLayout>
  }
  if (role === 'pharmacist') {
    return <PharmacistDashboardLayout>{children}</PharmacistDashboardLayout>
  }
  if (role === 'admin') {
    return <AdminDashboardLayout>{children}</AdminDashboardLayout>
  }

  // Fallback for other roles or if something goes wrong
  return <>{children}</>
}
