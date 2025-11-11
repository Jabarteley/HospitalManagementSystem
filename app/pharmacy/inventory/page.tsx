'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Pill, Plus, Edit, Trash2, Activity } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function InventoryPage() {
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
    batchNumber: 'B' + Date.now(), // Auto-generate batch number like admin
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
      } else {
        setError(data.error || 'Failed to fetch inventory')
      }
    } catch (error) {
      setError('An error occurred while fetching inventory')
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
          medicineName: formData.medicineName,
          category: formData.category,
          manufacturer: formData.manufacturer,
          batchNumber: formData.batchNumber,
          expiryDate: formData.expiryDate,
          quantity: Number(formData.quantity),
          unitPrice: Number(formData.unitPrice),
          genericName: '',
          reorderLevel: 10,
          description: '',
          sideEffects: [],
        }),
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
      setError('An error occurred while adding medicine')
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

  if (!session || !['admin', 'pharmacist'].includes(session.user.role)) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Inventory Management
        </h2>
        <p className="text-gray-600">Manage medicine stock</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Medicine Inventory</h3>
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
                placeholder="e.g. Paracetamol"
                value={formData.medicineName}
                onChange={(e) =>
                  setFormData({ ...formData, medicineName: e.target.value })
                }
                required
              />
              <Input
                label="Category"
                type="text"
                placeholder="e.g. Analgesic"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />
              <Input
                label="Manufacturer"
                type="text"
                placeholder="e.g. Pharma Inc."
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                required
              />
              <Input
                label="Quantity"
                type="number"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
              <Input
                label="Unit Price"
                type="number"
                placeholder="10.50"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                required
              />
              <Input
                label="Expiry Date"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
              <Input
                label="Batch Number"
                type="text"
                placeholder="Auto-generated"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })}
                required
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
                    setFormData({
                      medicineName: '',
                      category: '',
                      manufacturer: '',
                      quantity: 0,
                      unitPrice: 0,
                      expiryDate: '',
                      batchNumber: 'B' + Date.now(),
                    })
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
        )}
      </div>
    </div>
  )
}