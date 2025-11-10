'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, Calendar, FileText, Pill, Users, LogOut, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import { signOut } from 'next-auth/react'

export default function DoctorDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [medicalRecords, setMedicalRecords] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session.user.role !== 'doctor') {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.role === 'doctor') {
      fetchDoctorData()
    }
  }, [session])

  const fetchDoctorData = async () => {
    try {
      setLoading(true)
      
      // Fetch appointments for the doctor
      const appointmentResponse = await fetch('/api/appointments')
      if (appointmentResponse.ok) {
        const appointmentData = await appointmentResponse.json()
        setAppointments(appointmentData.appointments)
      }

      // Fetch medical records for the doctor
      const recordsResponse = await fetch('/api/medical-records')
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        setMedicalRecords(recordsData.records)
      }

      // Fetch patients assigned to the doctor
      const patientResponse = await fetch('/api/patients')
      if (patientResponse.ok) {
        const patientData = await patientResponse.json()
        setPatients(patientData.patients)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
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

  if (!session || session.user.role !== 'doctor') {
    return null
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, Dr. {session.user.firstName}!
          </h2>
          <p className="text-gray-600">
            Your professional dashboard
          </p>
        </div>

        {/* Doctor Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-lg font-semibold text-gray-900">
                  {appointments.filter(a => 
                    new Date(a.appointmentDate).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <FileText className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Records Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {medicalRecords.filter(r => 
                    new Date(r.visitDate).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-lg font-semibold text-gray-900">
                  {patients.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <Clock className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Tasks</p>
                <p className="text-lg font-semibold text-gray-900">
                  {appointments.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Today's Appointments
            </h3>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments
                  .filter(a => new Date(a.appointmentDate).toDateString() === new Date().toDateString())
                  .slice(0, 5)
                  .map((appointment) => (
                    <div key={appointment._id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                      <p className="text-gray-500 text-sm">{appointment.reason}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No appointments scheduled for today</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/appointments')}
            >
              View All Appointments
            </Button>
          </div>

          {/* Recent Medical Records */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Recent Medical Records
            </h3>
            {medicalRecords.length > 0 ? (
              <div className="space-y-4">
                {medicalRecords.slice(0, 5).map((record) => (
                  <div key={record._id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-900">
                        {record.patient?.firstName} {record.patient?.lastName}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        record.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {new Date(record.visitDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 text-sm truncate">{record.diagnosis}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No medical records found</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/medical-records')}
            >
              View All Records
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              size="md"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => router.push('/appointments')}
            >
              <Calendar className="w-6 h-6 mb-2 text-blue-600" />
              <span>Manage Appointments</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => router.push('/medical-records')}
            >
              <FileText className="w-6 h-6 mb-2 text-blue-600" />
              <span>Add Medical Record</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => router.push('/prescriptions')}
            >
              <Pill className="w-6 h-6 mb-2 text-blue-600" />
              <span>Issue Prescription</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}