'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Pill, Plus, Edit, Trash2, Users, Calendar, FileText, Activity, LogOut } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { signOut } from 'next-auth/react'

export default function PharmacyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inventory, setInventory] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inventory')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    category: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    unitPrice: 0,
    reorderLevel: 10,
    description: '',
    sideEffects: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && !['admin', 'pharmacist'].includes(session.user.role)) {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.role && ['admin', 'pharmacist'].includes(session.user.role)) {
      if (activeTab === 'inventory') {
        fetchInventory()
      } else if (activeTab === 'prescriptions') {
        fetchPrescriptions()
      }
    }
  }, [session, activeTab])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pharmacy/inventory')
      const data = await response.json()
      
      if (response.ok) {
        setInventory(data.inventory || [])
      } else {
        setError(data.error || 'Failed to fetch inventory')
      }
    } catch (error) {
      setError('An error occurred while fetching inventory')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/prescriptions')
      const data = await response.json()
      
      if (response.ok) {
        setPrescriptions(data.prescriptions || [])
      } else {
        setError(data.error || 'Failed to fetch prescriptions')
      }
    } catch (error) {
      setError('An error occurred while fetching prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/pharmacy/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expiryDate: new Date(formData.expiryDate),
          sideEffects: formData.sideEffects.split(',').map(s => s.trim()).filter(s => s),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          medicineName: '',
          genericName: '',
          category: '',
          manufacturer: '',
          batchNumber: '',
          expiryDate: '',
          quantity: 0,
          unitPrice: 0,
          reorderLevel: 10,
          description: '',
          sideEffects: '',
        })
        fetchInventory() // Refresh the list
      } else {
        setError(data.error || 'Failed to add medicine')
      }
    } catch (error) {
      setError('An error occurred while adding medicine')
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
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

  if (!session || !['admin', 'pharmacist'].includes(session.user.role)) {
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
            Pharmacy Management
          </h2>
          <p className="text-gray-600">Manage medicine stock and prescriptions</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-1 border-b">
              {['inventory', 'prescriptions'].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 font-medium ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {activeTab === 'inventory' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medicine</span>
              </Button>
            )}
          </div>

          {activeTab === 'inventory' && showCreateForm && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Add New Medicine
              </h3>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Medicine Name"
                  type="text"
                  placeholder="Brand name"
                  value={formData.medicineName}
                  onChange={(e) =>
                    setFormData({ ...formData, medicineName: e.target.value })
                  }
                  required
                />
                <Input
                  label="Generic Name"
                  type="text"
                  placeholder="Generic name"
                  value={formData.genericName}
                  onChange={(e) =>
                    setFormData({ ...formData, genericName: e.target.value })
                  }
                />
                <Input
                  label="Category"
                  type="text"
                  placeholder="e.g., Antibiotic, Painkiller"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                />
                <Input
                  label="Manufacturer"
                  type="text"
                  placeholder="Manufacturer name"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  required
                />
                <Input
                  label="Batch Number"
                  type="text"
                  placeholder="Batch number"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                  required
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  required
                />
                <Input
                  label="Quantity"
                  type="number"
                  placeholder="100"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                />
                <Input
                  label="Unit Price"
                  type="number"
                  placeholder="10.50"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  required
                />
                <Input
                  label="Reorder Level"
                  type="number"
                  placeholder="10"
                  value={formData.reorderLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderLevel: e.target.value })
                  }
                  required
                />
                <Input
                  label="Side Effects (comma-separated)"
                  type="text"
                  placeholder="dizziness, nausea"
                  value={formData.sideEffects}
                  onChange={(e) =>
                    setFormData({ ...formData, sideEffects: e.target.value })
                  }
                  className="md:col-span-2"
                />
                <Input
                  label="Description"
                  type="text"
                  placeholder="Medicine description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="md:col-span-2"
                />
                
                <div className="flex space-x-4 pt-4 md:col-span-2">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                  >
                    Add Medicine
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setError('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Activity className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          ) : activeTab === 'inventory' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.medicineName}
                        </div>
                        <div className="text-sm text-gray-500">{item.genericName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">${item.unitPrice}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${item.isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {item.isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inventory.length === 0 && (
                <div className="text-center py-12">
                  <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medicines in inventory</p>
                  <p className="text-sm text-gray-400 mt-2">Add a new medicine to get started</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issued Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prescriptions.map((prescription) => (
                    <tr key={prescription._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {prescription.patient?.firstName} {prescription.patient?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          Dr. {prescription.doctor?.firstName} {prescription.doctor?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {prescription.medications.map(med => `${med.medicineName} (${med.dosage})`).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(prescription.issuedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'}`}
                        >
                          {prescription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {prescriptions.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No prescriptions found</p>
                  <p className="text-sm text-gray-400 mt-2">Prescriptions will appear here when issued</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <DashboardCard
            icon={<Users className="w-8 h-8" />}
            title="Patients"
            description="Manage patient records and profiles"
            href="/patients"
          />
          <DashboardCard
            icon={<Calendar className="w-8 h-8" />}
            title="Appointments"
            description="Schedule and manage appointments"
            href="/appointments"
          />
          <DashboardCard
            icon={<FileText className="w-8 h-8" />}
            title="Medical Records"
            description="View and update patient records"
            href="/medical-records"
          />
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