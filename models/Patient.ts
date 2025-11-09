import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPatient extends Document {
  userId: mongoose.Types.ObjectId
  dateOfBirth: Date
  gender: 'male' | 'female' | 'other'
  bloodGroup?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  medicalHistory: string[]
  allergies: string[]
  chronicConditions: string[]
  currentMedications: string[]
  insuranceDetails?: {
    provider: string
    policyNumber: string
    expiryDate: Date
  }
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PatientSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
    medicalHistory: [{ type: String }],
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    currentMedications: [{ type: String }],
    insuranceDetails: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema)

export default Patient
