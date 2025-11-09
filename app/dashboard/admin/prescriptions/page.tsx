'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, FileText } from 'lucide-react'
import AdminLayout from './layout'

export default function AdminPrescriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Prescription Management</h2>
        <p className="text-gray-600">Manage prescriptions</p>
      </div>

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