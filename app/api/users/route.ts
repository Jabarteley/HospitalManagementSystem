import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Doctor from '@/models/Doctor'
import PharmacyInventory from '@/models/PharmacyInventory'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['doctor', 'pharmacist']),
  // Doctor-specific fields
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  department: z.string().optional(),
  consultationFee: z.number().optional(),
  qualifications: z.array(z.string()).optional(),
  experienceYears: z.number().optional(),
  availableSlots: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin'])

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')

    await dbConnect()

    const users = await User.find({ role }).select('-password').sort({ createdAt: -1 })

    // If we're looking for doctors, get their doctor-specific data as well
    if (role === 'doctor') {
      const populatedUsers = await Promise.all(users.map(async (user) => {
        const doctorData = await Doctor.findOne({ userId: user._id }).select('-_id -userId');
        return {
          ...user.toObject(),
          doctorData: doctorData ? doctorData.toObject() : null
        };
      }));
      return NextResponse.json({ users: populatedUsers }, { status: 200 })
    }

    return NextResponse.json({ users }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['admin'])

    const body = await req.json()
    const validatedData = createUserSchema.parse(body)

    await dbConnect()

    // Check if email already exists
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create the user
    const newUser = await User.create({
      ...validatedData,
      role: validatedData.role,
    })

    // If the user is a doctor, create a doctor profile
    if (validatedData.role === 'doctor') {
      await Doctor.create({
        userId: newUser._id,
        specialization: validatedData.specialization,
        licenseNumber: validatedData.licenseNumber,
        qualifications: validatedData.qualifications || [],
        experienceYears: validatedData.experienceYears || 0,
        department: validatedData.department,
        consultationFee: validatedData.consultationFee || 0,
        availableSlots: validatedData.availableSlots || [],
      })
    }

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE',
      entity: 'User',
      entityId: newUser._id,
      description: `New ${validatedData.role} created: ${newUser.email}`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: `${validatedData.role} created successfully`, user: { ...newUser.toObject(), password: undefined } },
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

    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}