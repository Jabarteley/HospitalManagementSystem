'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText, Plus, Edit, Trash2, Users, Calendar, Pill, Activity, LogOut } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { signOut } from 'next-auth/react'

export default function MedicalRecordsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    visitDate: '',
    symptoms: '',
    diagnosis: '',
    treatments: '',
    consultationFee: 0,
    status: 'open',
  })
  const [error, setError] = useState('')

  const loadAppointmentDetails = async (appointmentId: string) => {
    try {
      setLoading(true)
      // Fetch the specific appointment details
      const allAppointmentsResponse = await fetch('/api/appointments')
      if (allAppointmentsResponse.ok) {
        const data = await allAppointmentsResponse.json()
        const appointment = data.appointments.find((app: any) => app._id === appointmentId)
        
        if (appointment) {
          // Pre-fill the form with appointment details
          setFormData(prev => ({
            ...prev,
            patientId: appointment.patientId._id || appointment.patientId, // Use the correct patient ID
            visitDate: new Date(appointment.appointmentDate).toISOString().split('T')[0], // Format as YYYY-MM-DD
          }))
          setShowCreateForm(true)
        }
      }
    } catch (error) {
      console.error('Error loading appointment details:', error)
      setError('Failed to load appointment details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && !['admin', 'doctor'].includes(session.user.role)) {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.role && ['admin', 'doctor'].includes(session.user.role)) {
      fetchMedicalRecords()
      fetchPatients()
      if (session.user.role === 'admin') {
        fetchDoctors()
      } else {
        // If doctor, set their own ID as the doctorId by default
        setFormData(prev => ({ ...prev, doctorId: session.user.id }))
      }
      
      // Check if there's an appointment ID in the URL to pre-fill the form
      const appointmentId = searchParams.get('appointmentId')
      if (appointmentId && session.user.role === 'doctor') {
        loadAppointmentDetails(appointmentId)
      }
    }
  }, [session, searchParams])

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/medical-records')
      const data = await response.json()
      
      if (response.ok) {
        setRecords(data.records || [])
      } else {
        setError(data.error || 'Failed to fetch medical records')
      }
    } catch (error) {
      setError('An error occurred while fetching medical records')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      const data = await response.json()
      
      if (response.ok) {
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/users?role=doctor')
      const data = await response.json()
      
      if (response.ok) {
        setDoctors(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          visitDate: formData.visitDate, // Keep as string, API will convert it
          symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
          treatments: formData.treatments.split(',').map(t => t.trim()).filter(t => t),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          patientId: '',
          doctorId: session.user.role === 'doctor' ? session.user.id : '',
          visitDate: new Date().toISOString().split('T')[0],
          symptoms: '',
          diagnosis: '',
          treatments: '',
          consultationFee: 0,
          status: 'open',
        })
        
        // Clear the URL parameter if it was used to start this consultation
        if (searchParams.get('appointmentId')) {
          router.push('/medical-records', { scroll: false })
        }
        
        fetchMedicalRecords() // Refresh the list
      } else {
        setError(data.error || 'Failed to create medical record')
      }
    } catch (error) {
      setError('An error occurred while creating medical record')
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

  if (!session || !['admin', 'doctor'].includes(session.user.role)) {
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
            Medical Records Management
          </h2>
          <p className="text-gray-600">Handle patient health records and consultations</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Medical Records</h3>
            {(session.user.role === 'admin' || session.user.role === 'doctor') && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Record</span>
              </Button>
            )}
          </div>

          {showCreateForm && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Add New Medical Record
              </h3>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.patientId}
                    onChange={(e) =>
                      setFormData({ ...formData, patientId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.firstName} {patient.lastName} ({patient.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                {session.user.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doctor
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.doctorId}
                      onChange={(e) =>
                        setFormData({ ...formData, doctorId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map(doctor => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <Input
                  label="Visit Date"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) =>
                    setFormData({ ...formData, visitDate: e.target.value })
                  }
                  required
                />
                
                <Input
                  label="Symptoms (comma-separated)"
                  type="text"
                  placeholder="fever, headache, nausea"
                  value={formData.symptoms}
                  onChange={(e) =>
                    setFormData({ ...formData, symptoms: e.target.value })
                  }
                  required
                />
                
                <Input
                  label="Diagnosis"
                  type="text"
                  placeholder="Diagnosis details"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  required
                  className="md:col-span-2"
                />
                
                <Input
                  label="Treatments (comma-separated)"
                  type="text"
                  placeholder="medication, therapy, rest"
                  value={formData.treatments}
                  onChange={(e) =>
                    setFormData({ ...formData, treatments: e.target.value })
                  }
                  required
                  className="md:col-span-2"
                />
                
                <Input
                  label="Consultation Fee"
                  type="number"
                  placeholder="100"
                  value={formData.consultationFee}
                  onChange={(e) =>
                    setFormData({ ...formData, consultationFee: e.target.value })
                  }
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div className="flex space-x-4 pt-4 md:col-span-2">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                  >
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
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visit Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symptoms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnosis
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
                        <div className="text-sm text-gray-500">
                          {record.symptoms.join(', ')}
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
              {records.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medical records found</p>
                  <p className="text-sm text-gray-400 mt-2">Add a new record to get started</p>
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
            icon={<Pill className="w-8 h-8" />}
            title="Pharmacy"
            description="Manage inventory and prescriptions"
            href="/pharmacy"
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