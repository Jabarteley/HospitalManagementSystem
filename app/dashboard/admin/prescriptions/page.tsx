'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, FileText, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AdminPrescriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    medicalRecordId: '',
    medicineName: '',
    dosage: '',
    frequency: 'Once a day',
    duration: '7 days',
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
      fetchPrescriptions()
    }
  }, [session])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/prescriptions')
      const data = await response.json()
      
      if (response.ok) {
        setPrescriptions(data.prescriptions || [])
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          medicalRecordId: formData.medicalRecordId,
          medications: [{
            medicineName: formData.medicineName,
            dosage: formData.dosage,
            frequency: formData.frequency,
            duration: formData.duration,
          }]
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
            patientId: '',
            doctorId: '',
            medicalRecordId: '',
            medicineName: '',
            dosage: '',
            frequency: 'Once a day',
            duration: '7 days',
        })
        fetchPrescriptions() // Refresh the list
      } else {
        setError(data.error || 'Failed to create prescription')
      }
    } catch (error) {
      setError('An error occurred while creating the prescription')
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Prescription Management</h2>
                <p className="text-gray-600">Manage prescriptions</p>
            </div>
            <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2"
            >
                <Plus className="w-4 h-4" />
                <span>Create Prescription</span>
            </Button>
        </div>

        {showCreateForm && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Create New Prescription</h3>
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
                        label="Medical Record ID"
                        type="text"
                        placeholder="Enter medical record ID"
                        value={formData.medicalRecordId}
                        onChange={(e) => setFormData({ ...formData, medicalRecordId: e.target.value })}
                        required
                    />
                    <div className="md:col-span-2">
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Medication</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Medicine Name"
                                type="text"
                                placeholder="e.g. Amoxicillin"
                                value={formData.medicineName}
                                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                                required
                            />
                            <Input
                                label="Dosage"
                                type="text"
                                placeholder="e.g. 500mg"
                                value={formData.dosage}
                                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex space-x-4 pt-4 md:col-span-2">
                        <Button variant="primary" size="md" type="submit">
                            Create Prescription
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
          <h3 className="text-lg font-semibold text-gray-900">Prescriptions</h3>
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
                    Medications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prescriptions.map((prescription: any) => (
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
                        {prescription.medications.map((med: any) => `${med.medicineName} (${med.dosage})`).join(', ')}
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
                  </tr>
                ))}
              </tbody>
            </table>
            {prescriptions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No prescriptions found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}