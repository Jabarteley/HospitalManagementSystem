import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId
  specialization: string
  licenseNumber: string
  qualifications: string[]
  experienceYears: number
  department: string
  consultationFee: number
  availableSlots: {
    day: string
    startTime: string
    endTime: string
  }[]
  bio?: string
  createdAt: Date
  updatedAt: Date
}

const DoctorSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    qualifications: [{ type: String, required: true }],
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    availableSlots: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
    bio: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
)

const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema)

export default Doctor
