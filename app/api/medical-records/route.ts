import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import MedicalRecord from '@/models/MedicalRecord'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const createMedicalRecordSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  visitDate: z.string(),
  symptoms: z.array(z.string()),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  treatments: z.array(z.string()),
  consultationFee: z.number().min(0),
  status: z.enum(['open', 'closed']).default('open'),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor'])

    await dbConnect()

    let query: any = {}

    if (user.role === 'doctor') {
      query.doctorId = user.id // Doctors can only see their own records
    }

    const records = await MedicalRecord.find(query)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email')
      .populate('appointmentId', 'appointmentDate reason')
      .sort({ visitDate: -1 })

    return NextResponse.json({ records }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get medical records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor'])

    const body = await req.json()
    const validatedData = createMedicalRecordSchema.parse(body)

    await dbConnect()

    if (user.role === 'doctor' && validatedData.doctorId !== user.id) {
      return NextResponse.json(
        { error: 'Doctor can only create records for themselves' },
        { status: 403 }
      )
    }

    const record = await MedicalRecord.create({
      ...validatedData,
      doctorId: user.id, // Ensure doctor is the authenticated user
      visitDate: new Date(validatedData.visitDate),
    })

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE',
      entity: 'MedicalRecord',
      entityId: record._id,
      description: `New medical record created for patient`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: 'Medical record created successfully', record },
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

    console.error('Create medical record error:', error)
    return NextResponse.json(
      { error: 'Failed to create medical record' },
      { status: 500 }
    )
  }
}