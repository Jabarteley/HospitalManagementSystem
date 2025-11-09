import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Patient from '@/models/Patient'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const createPatientSchema = z.object({
  userId: z.string(),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
  }),
  medicalHistory: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
  currentMedications: z.array(z.string()).default([]),
  insuranceDetails: z.object({
    provider: z.string(),
    policyNumber: z.string(),
    expiryDate: z.string(),
  }).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor'])

    await dbConnect()

    let patients

    if (user.role === 'admin') {
      patients = await Patient.find()
        .populate('userId', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .limit(100)
    } else if (user.role === 'doctor') {
      const Doctor = (await import('@/models/Doctor')).default
      const MedicalRecord = (await import('@/models/MedicalRecord')).default
      
      const doctor = await Doctor.findOne({ userId: user.id })
      
      if (!doctor) {
        return NextResponse.json({ patients: [] }, { status: 200 })
      }

      const medicalRecords = await MedicalRecord.find({ doctorId: doctor._id }).distinct('patientId')

      patients = await Patient.find({ _id: { $in: medicalRecords } })
        .populate('userId', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .limit(100)
    }

    return NextResponse.json({ patients }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get patients error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'patient'])

    const body = await req.json()
    const validatedData = createPatientSchema.parse(body)

    await dbConnect()

    const existingPatient = await Patient.findOne({ userId: validatedData.userId })
    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient profile already exists' },
        { status: 400 }
      )
    }

    const patient = await Patient.create({
      ...validatedData,
      dateOfBirth: new Date(validatedData.dateOfBirth),
      insuranceDetails: validatedData.insuranceDetails
        ? {
            ...validatedData.insuranceDetails,
            expiryDate: new Date(validatedData.insuranceDetails.expiryDate),
          }
        : undefined,
      createdBy: user.id,
    })

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE',
      entity: 'Patient',
      entityId: patient._id as any,
      description: `New patient profile created`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: 'Patient created successfully', patient },
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

    console.error('Create patient error:', error)
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}
