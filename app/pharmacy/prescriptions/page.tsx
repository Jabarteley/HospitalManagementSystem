'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FileText, Activity } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function PrescriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isPatient = session?.user?.role === 'patient'
  const isPharmacist = session?.user?.role === 'pharmacist'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && !['pharmacist', 'patient'].includes(session.user.role)) {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.role) {
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
      } else {
        setError(data.error || 'Failed to fetch prescriptions')
      }
    } catch (error) {
      setError('An error occurred while fetching prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const updatePrescriptionStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchPrescriptions() // Refresh the list
      } else {
        setError(data.error || 'Failed to update prescription status')
      }
    } catch (error) {
      setError('An error occurred while updating status')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {isPatient ? 'My Prescriptions' : 'Prescription Dispensing'}
        </h2>
        <p className="text-gray-600">
          {isPatient ? 'View your prescribed medications' : 'View and dispense pending prescriptions'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {!isPatient && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                )}
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
                {isPharmacist && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prescriptions.map((prescription: any) => (
                <tr key={prescription._id} className="hover:bg-gray-50">
                  {!isPatient && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.patient?.firstName} {prescription.patient?.lastName}
                      </div>
                    </td>
                  )}
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
                  {isPharmacist && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {prescription.status === 'pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => updatePrescriptionStatus(prescription._id, 'dispensed')}
                        >
                          Dispense
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {prescriptions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No prescriptions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
