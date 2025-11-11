'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, Calendar, FileText, Pill, Users, LogOut, Package } from 'lucide-react'
import Button from '@/components/ui/Button'
import { signOut } from 'next-auth/react'

export default function PharmacistDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState([])
  const [inventory, setInventory] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session.user.role !== 'pharmacist') {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.role === 'pharmacist') {
      fetchPharmacistData()
    }
  }, [session])

  const fetchPharmacistData = async () => {
    try {
      setLoading(true)
      
      // Fetch prescriptions for the pharmacist
      const prescriptionResponse = await fetch('/api/prescriptions')
      if (prescriptionResponse.ok) {
        const prescriptionData = await prescriptionResponse.json()
        setPrescriptions(prescriptionData.prescriptions)
      }

      // Fetch pharmacy inventory
      const inventoryResponse = await fetch('/api/pharmacy/inventory')
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        setInventory(inventoryData.inventory)
        
        // Get low stock items
        const lowStock = inventoryData.inventory.filter(item => item.isLowStock)
        setLowStockItems(lowStock)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || loading) {
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
            Pharmacy management dashboard
          </p>
        </div>

        {/* Pharmacist Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Pill className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Prescriptions</p>
                <p className="text-lg font-semibold text-gray-900">
                  {prescriptions.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <Package className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Medicines</p>
                <p className="text-lg font-semibold text-gray-900">
                  {inventory.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <Package className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-lg font-semibold text-gray-900 text-red-600">
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <FileText className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Dispensed Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {prescriptions.filter(p => 
                    p.status === 'dispensed' && 
                    new Date(p.dispensedDate).toDateString() === new Date().toDateString()
                  ).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Prescriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Pill className="w-5 h-5 mr-2 text-blue-600" />
              Pending Prescriptions
            </h3>
            {prescriptions.length > 0 ? (
              <div className="space-y-4">
                {prescriptions
                  .filter(p => p.status === 'pending')
                  .slice(0, 5)
                  .map((prescription) => (
                    <div key={prescription._id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">
                          {prescription.patient?.firstName} {prescription.patient?.lastName}
                        </h4>
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          {prescription.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Dr. {prescription.doctor?.firstName} {prescription.doctor?.lastName}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {prescription.medications.map(med => med.medicineName).join(', ')}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No pending prescriptions</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/pharmacy/prescriptions')}
            >
              View All Prescriptions
            </Button>
          </div>

          {/* Low Stock Items */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-red-600" />
              Low Stock Items
            </h3>
            {lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item._id} className="border-l-4 border-red-500 pl-4 py-2">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-900">
                        {item.medicineName}
                      </h4>
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        {item.quantity} left
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{item.category}</p>
                    <p className="text-gray-500 text-sm">
                      Reorder level: {item.reorderLevel}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No low stock items</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/pharmacy/inventory')}
            >
              Manage Inventory
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              size="md"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => router.push('/pharmacy/prescriptions')}
            >
              <Pill className="w-6 h-6 mb-2 text-blue-600" />
              <span>Process Prescriptions</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => router.push('/pharmacy/inventory')}
            >
              <Package className="w-6 h-6 mb-2 text-blue-600" />
              <span>Manage Inventory</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => router.push('/reports')}
            >
              <FileText className="w-6 h-6 mb-2 text-blue-600" />
              <span>Generate Reports</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}