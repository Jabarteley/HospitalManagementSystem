'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Activity } from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      // Redirect to role-specific dashboard
      switch (session.user.role) {
        case 'admin':
          router.push('/dashboard/admin/users')
          break
        case 'doctor':
          router.push('/dashboard/doctor')
          break
        case 'patient':
          router.push('/dashboard/patient')
          break
        case 'pharmacist':
          router.push('/dashboard/pharmacist')
          break
        default:
          router.push('/dashboard/admin/users') // Default to admin dashboard
      }
    }
  }, [status, router, session])

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

  return null // This page should redirect, so return null
}
