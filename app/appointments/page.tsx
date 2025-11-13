'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, Edit, Trash2, Users, FileText, Pill, Activity } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    notes: '',
  })
  const [error, setError] = useState('')

  const isPatient = session?.user?.role === 'patient'
  const isAdminOrNurse = session?.user?.role === 'admin' || session?.user?.role === 'nurse'
  const isDoctor = session?.user?.role === 'doctor'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && !['admin', 'doctor', 'patient', 'nurse'].includes(session.user.role)) {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.role) {
      fetchAppointments()
      if (isAdminOrNurse) {
        fetchPatients()
        fetchDoctors()
      }
    }
  }, [session])

  useEffect(() => {
    if (isPatient && session?.user?.id) {
      // When a patient opens the form, pre-fill their patientId
      setFormData(prev => ({ ...prev, patientId: session.user.id }));
    }
  }, [isPatient, session?.user?.id, showCreateForm]);


  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments')
      const data = await response.json()
      
      if (response.ok) {
        setAppointments(data.appointments || [])
      } else {
        setError(data.error || 'Failed to fetch appointments')
      }
    } catch (error) {
      setError('An error occurred while fetching appointments')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const payload = isPatient ? { ...formData, patientId: session?.user?.id } : formData;

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          appointmentDate: new Date(payload.appointmentDate),
          status: 'pending'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          patientId: isPatient && session?.user?.id ? session.user.id : '',
          doctorId: '',
          appointmentDate: '',
          startTime: '',
          endTime: '',
          reason: '',
          notes: '',
        })
        fetchAppointments() // Refresh the list
      } else {
        setError(data.error || 'Failed to create appointment')
      }
    } catch (error) {
      setError('An error occurred while creating appointment')
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appointmentId, 
          status: newStatus,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchAppointments() // Refresh the list
      } else {
        setError(data.error || 'Failed to update appointment')
      }
    } catch (error) {
      setError('An error occurred while updating the appointment')
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

  if (!session || !['admin', 'doctor', 'patient', 'nurse'].includes(session.user.role)) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isPatient ? 'My Appointments' : 'Appointment Management'}
          </h2>
          <p className="text-gray-600">
            {isPatient ? 'View and manage your scheduled appointments' : 'Schedule and manage appointments for all patients'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
            {(session?.user?.role === 'admin') && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Appointment</span>
              </Button>
            )}
          </div>

          {showCreateForm && session?.user?.role === 'admin' && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Schedule New Appointment
              </h3>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isAdminOrNurse && ( // Only show patient selection for admin/nurse
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
                      {patients.map((patient: any) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.firstName} {patient.lastName} ({patient.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
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
                    {doctors.map((doctor: any) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization})
                      </option>
                    ))}
                  </select>
                </div>
                
                <Input
                  label="Date"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, appointmentDate: e.target.value })
                  }
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </div>
                
                <Input
                  label="Reason"
                  type="text"
                  placeholder="Consultation reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  required
                  className="md:col-span-2"
                />
                
                <div className="flex space-x-4 pt-4 md:col-span-2">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                  >
                    Schedule Appointment
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
                    {!isPatient && ( // Hide Patient column for patients
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {!isPatient && ( // Hide Actions column for patients
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment: any) => (
                    <tr key={appointment._id} className="hover:bg-gray-50">
                      {!isPatient && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(appointment.appointmentDate).toLocaleDateString()}<br />
                          {appointment.startTime} - {appointment.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{appointment.reason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'}`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      {!isPatient && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isDoctor && appointment.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2 text-green-600 hover:text-green-800"
                              onClick={() => updateAppointmentStatus(appointment._id, 'approved')}
                            >
                              Approve
                            </Button>
                          )}
                          {isDoctor && appointment.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2 text-blue-600 hover:text-blue-800"
                              onClick={() => router.push(`/medical-records?appointmentId=${appointment._id}`)}
                            >
                              Start Consultation
                            </Button>
                          )}
                          {(isAdminOrNurse || (isDoctor && ['pending', 'approved'].includes(appointment.status))) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {appointments.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments found</p>
                  <p className="text-sm text-gray-400 mt-2">Schedule an appointment to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  )
}