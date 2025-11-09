import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Patient from '@/models/Patient'
import User from '@/models/User'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone: z.string().min(1, 'Emergency contact phone is required'),
  }),
  medicalHistory: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  insuranceDetails: z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    expiryDate: z.string().optional(),
  }).optional(),
  createdBy: z.string(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'nurse'])

    await dbConnect()

    const patients = await Patient.find({})
      .populate('userId', 'email firstName lastName phone')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })

    // Map to include user data directly in the patient object
    const patientsWithUserData = patients.map(patient => ({
      ...patient.toObject(),
      email: patient.userId?.email,
      firstName: patient.userId?.firstName,
      lastName: patient.userId?.lastName,
      phone: patient.userId?.phone,
    }))

    return NextResponse.json({ patients: patientsWithUserData }, { status: 200 })
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
    const user = await requireAuth(['admin', 'nurse'])

    const body = await req.json()
    const validatedData = createPatientSchema.parse(body)

    await dbConnect()

    // Check if user with this email already exists
    let existingUser = await User.findOne({ email: validatedData.email })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Create a new user account for the patient
    const patientUser = await User.create({
      email: validatedData.email,
      password: 'TempPass123!', // Default temporary password
      role: 'patient',
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
    })

    // Create patient profile
    const patient = await Patient.create({
      userId: patientUser._id,
      dateOfBirth: new Date(validatedData.dateOfBirth),
      gender: validatedData.gender,
      bloodGroup: validatedData.bloodGroup,
      address: validatedData.address,
      emergencyContact: validatedData.emergencyContact,
      medicalHistory: validatedData.medicalHistory || [],
      allergies: validatedData.allergies || [],
      chronicConditions: validatedData.chronicConditions || [],
      currentMedications: validatedData.currentMedications || [],
      insuranceDetails: validatedData.insuranceDetails,
      createdBy: validatedData.createdBy,
    })

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE',
      entity: 'Patient',
      entityId: patient._id,
      description: `New patient registered: ${patientUser.firstName} ${patientUser.lastName}`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { 
        message: 'Patient created successfully', 
        patient: {
          ...patient.toObject(),
          firstName: patientUser.firstName,
          lastName: patientUser.lastName,
          email: patientUser.email,
          phone: patientUser.phone,
        }
      },
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