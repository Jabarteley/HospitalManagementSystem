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
    const user = await requireAuth(['admin', 'doctor', 'patient'])

    await dbConnect()

    let query: any = {}

    if (user.role === 'doctor') {
      query.doctorId = user.id // Doctors can only see records they created
    } else if (user.role === 'patient') {
      // Patients can only see their own records
      const Patient = (await import('@/models/Patient')).default
      const patient = await Patient.findOne({ userId: user.id })
      if (!patient) {
        return NextResponse.json({ records: [] }, { status: 200 })
      }
      query.patientId = patient._id
    }

    const records = await MedicalRecord.find(query)
      .populate('patientId', 'userId')
      .populate('doctorId', 'userId')
      .populate('appointmentId', 'appointmentDate reason')
      .sort({ visitDate: -1 })

    // Add patient and doctor names to the response
    const recordsWithNames = await Promise.all(records.map(async (record) => {
      // Fetch patient details
      const patient = await Patient.findById(record.patientId)
        .populate('userId', 'firstName lastName email')
      
      // Fetch doctor details
      const doctor = await Doctor.findById(record.doctorId)
        .populate('userId', 'firstName lastName email')
      
      return {
        ...record.toObject(),
        patient: patient?.userId,
        doctor: doctor?.userId,
      }
    }))

    return NextResponse.json({ records: recordsWithNames }, { status: 200 })
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