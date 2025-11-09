import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId
  appointmentDate: Date
  startTime: string
  endTime: string
  status: 'pending' | 'approved' | 'completed' | 'canceled'
  reason: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const AppointmentSchema: Schema = new Schema(
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
    appointmentDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'canceled'],
      default: 'pending',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
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

AppointmentSchema.index({ doctorId: 1, appointmentDate: 1, startTime: 1 })

const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>('Appointment', AppointmentSchema)

export default Appointment
