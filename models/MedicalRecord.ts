import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMedicalRecord extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  visitDate: Date
  symptoms: string[]
  diagnosis: string
  treatments: string[]
  prescriptionId?: mongoose.Types.ObjectId
  labTests?: {
    testName: string
    result: string
    date: Date
  }[]
  vitalSigns?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    weight?: number
    height?: number
  }
  consultationFee: number
  status: 'open' | 'closed'
  attachments?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const MedicalRecordSchema: Schema = new Schema(
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
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    visitDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    symptoms: [{ type: String, required: true }],
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    treatments: [{ type: String, required: true }],
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    labTests: [
      {
        testName: { type: String, required: true },
        result: { type: String, required: true },
        date: { type: Date, required: true },
      },
    ],
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      weight: Number,
      height: Number,
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    attachments: [{ type: String }],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

MedicalRecordSchema.index({ patientId: 1, visitDate: -1 })

const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord ||
  mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema)

export default MedicalRecord
