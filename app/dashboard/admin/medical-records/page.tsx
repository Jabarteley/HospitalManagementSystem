'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AdminMedicalRecordsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    visitDate: '',
    symptoms: '',
    diagnosis: '',
    treatments: '',
    consultationFee: 0,
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
      fetchRecords()
    }
  }, [session])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/medical-records')
      const data = await response.json()
      
      if (response.ok) {
        setRecords(data.records || [])
      }
    } catch (error) {
      console.error('Error fetching medical records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          symptoms: formData.symptoms.split(',').map(s => s.trim()),
          treatments: formData.treatments.split(',').map(t => t.trim()),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          patientId: '',
          doctorId: '',
          visitDate: '',
          symptoms: '',
          diagnosis: '',
          treatments: '',
          consultationFee: 0,
        })
        fetchRecords() // Refresh the list
      } else {
        setError(data.error || 'Failed to create medical record')
      }
    } catch (error) {
      setError('An error occurred while creating the medical record')
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Medical Records Management</h2>
          <p className="text-gray-600">Manage patient medical records and consultations</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Record</span>
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Create New Medical Record</h3>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Patient ID"
              type="text"
              placeholder="Enter patient ID"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
            />
            <Input
              label="Doctor ID"
              type="text"
              placeholder="Enter doctor ID"
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              required
            />
            <Input
              label="Visit Date"
              type="date"
              value={formData.visitDate}
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              required
            />
            <Input
              label="Symptoms (comma-separated)"
              type="text"
              placeholder="e.g. fever, cough"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              required
            />
            <Input
              label="Diagnosis"
              type="text"
              placeholder="Diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
            />
            <Input
              label="Treatments (comma-separated)"
              type="text"
              placeholder="e.g. paracetamol, bed rest"
              value={formData.treatments}
              onChange={(e) => setFormData({ ...formData, treatments: e.target.value })}
              required
            />
            <Input
              label="Consultation Fee"
              type="number"
              placeholder="100"
              value={formData.consultationFee}
              onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
              required
            />
            <div className="flex space-x-4 pt-4">
              <Button variant="primary" size="md" type="submit">
                Create Record
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
          <h3 className="text-lg font-semibold text-gray-900">Medical Records</h3>
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
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visit Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record: any) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.patient?.firstName} {record.patient?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        Dr. {record.doctor?.firstName} {record.doctor?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(record.visitDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{record.diagnosis}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${record.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No medical records found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}