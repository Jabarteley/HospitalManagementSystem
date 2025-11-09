import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Prescription from '@/models/Prescription'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const createPrescriptionSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  medicalRecordId: z.string(),
  medications: z.array(
    z.object({
      medicineName: z.string().min(1, 'Medicine name is required'),
      dosage: z.string().min(1, 'Dosage is required'),
      frequency: z.string().min(1, 'Frequency is required'),
      duration: z.string().min(1, 'Duration is required'),
      instructions: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'pharmacist'])

    await dbConnect()

    let query: any = {}

    if (user.role === 'pharmacist') {
      query.status = { $ne: 'completed' } // Only active prescriptions for pharmacist
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email')
      .populate('medicalRecordId', 'visitDate diagnosis')
      .sort({ issuedDate: -1 })

    return NextResponse.json({ prescriptions }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get prescriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor'])

    const body = await req.json()
    const validatedData = createPrescriptionSchema.parse(body)

    await dbConnect()

    const prescription = await Prescription.create({
      ...validatedData,
      doctorId: user.id, // Ensure doctor is the authenticated user
    })

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE',
      entity: 'Prescription',
      entityId: prescription._id,
      description: `New prescription created for patient`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: 'Prescription created successfully', prescription },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Create prescription error:', error)
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    )
  }
}