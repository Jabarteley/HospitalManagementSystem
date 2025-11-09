import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBilling extends Document {
  patientId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  medicalRecordId?: mongoose.Types.ObjectId
  prescriptionId?: mongoose.Types.ObjectId
  invoiceNumber: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  subtotal: number
  tax: number
  discount: number
  totalAmount: number
  status: 'paid' | 'unpaid' | 'partially_paid' | 'canceled'
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'insurance'
  paidAmount: number
  balanceAmount: number
  paymentDate?: Date
  dueDate: Date
  notes?: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BillingSchema: Schema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    medicalRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalRecord',
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'partially_paid', 'canceled'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer', 'insurance'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: Date,
    dueDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
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

BillingSchema.index({ patientId: 1, createdAt: -1 })
BillingSchema.index({ status: 1 })
BillingSchema.index({ invoiceNumber: 1 })

const Billing: Model<IBilling> =
  mongoose.models.Billing ||
  mongoose.model<IBilling>('Billing', BillingSchema)

export default Billing
