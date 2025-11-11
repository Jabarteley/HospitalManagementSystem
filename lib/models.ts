// Import all models to ensure they are registered with Mongoose
import User from '@/models/User'
import Patient from '@/models/Patient'
import Doctor from '@/models/Doctor'
import Appointment from '@/models/Appointment'
import MedicalRecord from '@/models/MedicalRecord'
import Prescription from '@/models/Prescription'
import PharmacyInventory from '@/models/PharmacyInventory'
import Billing from '@/models/Billing'
import AuditLog from '@/models/AuditLog'

// Export all models to ensure they're registered when this file is imported
export {
  User,
  Patient,
  Doctor,
  Appointment,
  MedicalRecord,
  Prescription,
  PharmacyInventory,
  Billing,
  AuditLog
}