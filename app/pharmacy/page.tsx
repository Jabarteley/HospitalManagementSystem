'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Activity, Package, Pill } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function PharmacyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && !['admin', 'pharmacist'].includes(session.user.role)) {
      router.push('/dashboard')
    } else if (status === 'authenticated' && ['admin', 'pharmacist'].includes(session.user.role)) {
      // Redirect to the inventory page by default
      router.push('/pharmacy/inventory')
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

  if (!session || !['admin', 'pharmacist'].includes(session.user.role)) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Pharmacy Management
        </h2>
        <p className="text-gray-600">Manage medicine stock and prescriptions</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-blue-100">
          <div className="text-blue-600 mb-4">
            <Package className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventory Management</h3>
          <p className="text-gray-600 text-sm mb-4">Manage medicine stock and inventory levels</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/pharmacy/inventory')}
            className="flex items-center space-x-2"
          >
            <Package className="w-4 h-4" />
            <span>Manage Inventory</span>
          </Button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-blue-100">
          <div className="text-blue-600 mb-4">
            <Pill className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Prescription Management</h3>
          <p className="text-gray-600 text-sm mb-4">View and process prescriptions</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/pharmacy/prescriptions')}
            className="flex items-center space-x-2"
          >
            <Pill className="w-4 h-4" />
            <span>Manage Prescriptions</span>
          </Button>
        </div>
      </div>
    </div>
  )
}