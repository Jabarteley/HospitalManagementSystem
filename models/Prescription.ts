import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPrescription extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  medicalRecordId: mongoose.Types.ObjectId
  medications: {
    medicineName: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
  }[]
  status: 'pending' | 'dispensed' | 'canceled'
  issuedDate: Date
  dispensedDate?: Date
  dispensedBy?: mongoose.Types.ObjectId
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const PrescriptionSchema: Schema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    medicalRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalRecord',
      required: true,
    },
    medications: [
      {
        medicineName: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'dispensed', 'canceled'],
      default: 'pending',
    },
    issuedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dispensedDate: Date,
    dispensedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

PrescriptionSchema.index({ patientId: 1, issuedDate: -1 })
PrescriptionSchema.index({ status: 1 })

const Prescription: Model<IPrescription> =
  mongoose.models.Prescription ||
  mongoose.model<IPrescription>('Prescription', PrescriptionSchema)

export default Prescription
