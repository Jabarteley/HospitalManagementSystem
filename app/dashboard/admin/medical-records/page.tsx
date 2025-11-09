'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import AdminLayout from '../layout'

export default function AdminMedicalRecordsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState([])
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Medical Records Management</h2>
        <p className="text-gray-600">Manage patient medical records and consultations</p>
      </div>

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
                {records.map((record) => (
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