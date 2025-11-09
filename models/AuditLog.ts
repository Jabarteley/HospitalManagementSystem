import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId
  userRole: string
  action: string
  entity: string
  entityId?: mongoose.Types.ObjectId
  description: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  timestamp: Date
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'APPROVE',
        'CANCEL',
        'DISPENSE',
        'PAYMENT',
      ],
    },
    entity: {
      type: String,
      required: true,
      enum: [
        'User',
        'Patient',
        'Doctor',
        'Appointment',
        'MedicalRecord',
        'Prescription',
        'PharmacyInventory',
        'Billing',
        'System',
      ],
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
  }
)

AuditLogSchema.index({ userId: 1, timestamp: -1 })
AuditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 })
AuditLogSchema.index({ timestamp: -1 })

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

export default AuditLog
