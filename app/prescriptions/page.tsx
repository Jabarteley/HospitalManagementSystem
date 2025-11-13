'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Edit, Trash2, Users, Calendar, Pill, Activity } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function PrescriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [patients, setPatients] = useState([])
  const [medicalRecords, setMedicalRecords] = useState([])
  const [formData, setFormData] = useState({
    patientId: '',
    medicalRecordId: '',
    medications: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: '',
  })
  const [error, setError] = useState('')

  const isPatient = session?.user?.role === 'patient'
  const isAdmin = session?.user?.role === 'admin'
  const isDoctor = session?.user?.role === 'doctor'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && !['admin', 'doctor', 'patient'].includes(session.user.role)) {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.role) {
      fetchPrescriptions()
      if (isAdmin) {
        fetchPatients()
        fetchMedicalRecords()
      } else if (isDoctor) {
        fetchPatientsByDoctor()
        fetchMedicalRecordsByDoctor()
      }
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

  const fetchPatientsByDoctor = async () => {
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

  const fetchMedicalRecordsByDoctor = async () => {
    try {
      const response = await fetch('/api/medical-records')
      const data = await response.json()

      if (response.ok) {
        setMedicalRecords(data.records || [])
      } else {
        console.error('Failed to fetch medical records:', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Failed to fetch medical records:', error)
    }
  }

  const fetchMedicalRecords = async () => {
    try {
      const response = await fetch('/api/medical-records')
      const data = await response.json()

      if (response.ok) {
        setMedicalRecords(data.records || [])
      } else {
        console.error('Failed to fetch medical records:', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Failed to fetch medical records:', error)
    }
  }

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    })
  }

  const removeMedication = (index: number) => {
    if (formData.medications.length > 1) {
      const newMedications = [...formData.medications]
      newMedications.splice(index, 1)
      setFormData({
        ...formData,
        medications: newMedications
      })
    }
  }

  const updateMedication = (index: number, field: string, value: string) => {
    const newMedications = [...formData.medications]
    newMedications[index] = { ...newMedications[index], [field]: value }
    setFormData({
      ...formData,
      medications: newMedications
    })
  }

  const handleMedicalRecordChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const medicalRecordId = e.target.value;
    setFormData({ ...formData, medicalRecordId });
    
    // For doctors, when medical record is selected, also set the patientId from the record
    if (isDoctor) {
      const selectedRecord = medicalRecords.find((record: any) => record._id === medicalRecordId);
      if (selectedRecord && selectedRecord.patientId) {
        setFormData(prev => ({
          ...prev,
          medicalRecordId,
          patientId: typeof selectedRecord.patientId === 'object' 
            ? selectedRecord.patientId._id 
            : selectedRecord.patientId
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, medicalRecordId }));
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
          ...formData,
          doctorId: session?.user?.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          patientId: '',
          medicalRecordId: '',
          medications: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
          notes: '',
        })
        fetchPrescriptions() // Refresh the list
      } else {
        setError(data.error || 'Failed to create prescription')
      }
    } catch (error) {
      setError('An error occurred while creating prescription')
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

  if (!session || !['admin', 'doctor', 'patient'].includes(session.user.role)) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isPatient ? 'My Prescriptions' : 'Prescription Management'}
          </h2>
          <p className="text-gray-600">
            {isPatient ? 'View your prescribed medications' : 'Issue and manage prescriptions'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Prescriptions</h3>
            {!(isPatient) && ( // Only admin and doctor can issue prescriptions
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Prescription</span>
              </Button>
            )}
          </div>

          {showCreateForm && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Issue New Prescription
              </h3>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                {isAdmin && (
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
                    Medical Record
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.medicalRecordId}
                    onChange={handleMedicalRecordChange}
                    required
                  >
                    <option value="">Select Medical Record</option>
                    {medicalRecords
                      .filter((record: any) => {
                        // For admin, show all records
                        if (isAdmin) return true;
                        // For doctor, show records related to the selected patient
                        return formData.patientId ? record.patient?.id === formData.patientId : true;
                      })
                      .map((record: any) => (
                        <option key={record._id} value={record._id}>
                          {record.patient?.firstName} {record.patient?.lastName} - {new Date(record.visitDate).toLocaleDateString()} - {record.diagnosis}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-semibold text-gray-900">Medications</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={addMedication}
                    >
                      Add Medication
                    </Button>
                  </div>
                  
                  {formData.medications.map((med, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                      <Input
                        label="Medicine Name"
                        type="text"
                        placeholder="e.g., Paracetamol"
                        value={med.medicineName}
                        onChange={(e) => updateMedication(index, 'medicineName', e.target.value)}
                        required
                      />
                      <Input
                        label="Dosage"
                        type="text"
                        placeholder="e.g., 500mg"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        required
                      />
                      <Input
                        label="Frequency"
                        type="text"
                        placeholder="e.g., 3 times/day"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        required
                      />
                      <Input
                        label="Duration"
                        type="text"
                        placeholder="e.g., 7 days"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        required
                      />
                      <Input
                        label="Instructions"
                        type="text"
                        placeholder="e.g., after meal"
                        value={med.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      />
                      
                      {formData.medications.length > 1 && (
                        <div className="md:col-span-5 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <Input
                  label="Notes"
                  type="text"
                  placeholder="Additional notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="md:col-span-2"
                />
                
                <div className="flex space-x-4 pt-4">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                  >
                    Issue Prescription
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
                      Medications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issued Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {!(isPatient || isDoctor) && ( // Hide Actions column for patients and doctors
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
                      {!(isPatient || isDoctor) && (
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
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {prescriptions.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No prescriptions found</p>
                  <p className="text-sm text-gray-400 mt-2">Issue a new prescription to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  )
}