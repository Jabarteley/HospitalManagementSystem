'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, Pill, Package, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AdminPharmacyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    medicineName: '',
    category: '',
    manufacturer: '',
    quantity: 0,
    unitPrice: 0,
    expiryDate: '',
    batchNumber: 'B' + Date.now(), // Dummy batch number
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session.user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchInventory()
    }
  }, [session])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pharmacy/inventory')
      const data = await response.json()
      
      if (response.ok) {
        setInventory(data.inventory || [])
      }
    } catch (error) {
      console.error('Error fetching pharmacy inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/pharmacy/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
            medicineName: '',
            category: '',
            manufacturer: '',
            quantity: 0,
            unitPrice: 0,
            expiryDate: '',
            batchNumber: 'B' + Date.now(),
        })
        fetchInventory() // Refresh the list
      } else {
        setError(data.error || 'Failed to add medicine')
      }
    } catch (error) {
      setError('An error occurred while adding the medicine')
    }
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

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Pharmacy Management</h2>
                <p className="text-gray-600">Manage pharmacy inventory and prescriptions</p>
            </div>
            <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
            >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
            </Button>
        </div>

        {showCreateForm && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Add New Medicine</h3>
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Medicine Name"
                        type="text"
                        placeholder="e.g. Paracetamol"
                        value={formData.medicineName}
                        onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                        required
                    />
                    <Input
                        label="Category"
                        type="text"
                        placeholder="e.g. Analgesic"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                    />
                    <Input
                        label="Manufacturer"
                        type="text"
                        placeholder="e.g. Pharma Inc."
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        required
                    />
                    <Input
                        label="Quantity"
                        type="number"
                        placeholder="100"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        required
                    />
                    <Input
                        label="Unit Price"
                        type="number"
                        placeholder="10.50"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                        required
                    />
                    <Input
                        label="Expiry Date"
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        required
                    />
                    <div className="flex space-x-4 pt-4 md:col-span-2">
                        <Button variant="primary" size="md" type="submit">
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

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Medicine Inventory</h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Activity className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
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
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item: any) => (
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${item.isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                      >
                        {item.isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inventory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No inventory found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}