import AuditLog from '@/models/AuditLog'
import { Types } from 'mongoose'

interface AuditLogParams {
  userId: string | Types.ObjectId
  userRole: string
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'CANCEL' | 'DISPENSE' | 'PAYMENT'
  entity: 'User' | 'Patient' | 'Doctor' | 'Appointment' | 'MedicalRecord' | 'Prescription' | 'PharmacyInventory' | 'Billing' | 'System'
  entityId?: string | Types.ObjectId
  description: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await AuditLog.create({
      userId: params.userId,
      userRole: params.userRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      description: params.description,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
