import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Prescription from '@/models/Prescription'
import Patient from '@/models/Patient'  // Import to ensure Patient model is registered
import User from '@/models/User'      // Import to ensure User model is registered
import Doctor from '@/models/Doctor'  // Import to ensure Doctor model is registered
import MedicalRecord from '@/models/MedicalRecord'  // Import to ensure MedicalRecord model is registered
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
    const user = await requireAuth(['admin', 'doctor', 'pharmacist', 'patient'])

    await dbConnect()

    const aggregation: any = []

    if (user.role === 'pharmacist') {
      aggregation.push({ $match: { status: { $in: ['pending'] } } })
    } else if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user.id })
      if (!patient) {
        return NextResponse.json({ prescriptions: [] }, { status: 200 })
      }
      aggregation.push({ $match: { patientId: patient._id } })
    }

    aggregation.push(
      { $sort: { issuedDate: -1 } },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patientInfo',
        },
      },
      { $unwind: { path: '$patientInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'patientInfo.userId',
          foreignField: '_id',
          as: 'patient',
        },
      },
      { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo',
        },
      },
      { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'doctorInfo.userId',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'patient.password': 0,
          'patient.emailVerified': 0,
          'patient.createdAt': 0,
          'patient.updatedAt': 0,
          'doctor.password': 0,
          'doctor.emailVerified': 0,
          'doctor.createdAt': 0,
          'doctor.updatedAt': 0,
          patientInfo: 0,
          doctorInfo: 0,
        },
      }
    )

    const prescriptions = await Prescription.aggregate(aggregation)

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