import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Appointment from '@/models/Appointment'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const createAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  appointmentDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'patient', 'nurse'])

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    await dbConnect()

    let query: any = {}

    if (user.role === 'patient') {
      const Patient = (await import('@/models/Patient')).default
      const patient = await Patient.findOne({ userId: user.id })
      if (!patient) {
        return NextResponse.json({ appointments: [] }, { status: 200 })
      }
      query.patientId = patient._id
    } else if (user.role === 'doctor') {
      const Doctor = (await import('@/models/Doctor')).default
      const doctor = await Doctor.findOne({ userId: user.id })
      if (!doctor) {
        return NextResponse.json({ appointments: [] }, { status: 200 })
      }
      query.doctorId = doctor._id
    }
    // Admins and nurses can see all appointments or we can limit nurses to only see appointments for patients they're managing

    if (status) {
      query.status = status
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'userId firstName lastName email')
      .populate('doctorId', 'userId firstName lastName email')
      .sort({ appointmentDate: -1, startTime: -1 })
      .limit(100)

    // Add patient and doctor names to the response
    const appointmentsWithNames = await Promise.all(appointments.map(async (appointment) => {
      // Fetch patient details
      const patient = await Patient.findById(appointment.patientId)
        .populate('userId', 'firstName lastName email')
      
      // Fetch doctor details
      const doctor = await Doctor.findById(appointment.doctorId)
        .populate('userId', 'firstName lastName email')
      
      return {
        ...appointment.toObject(),
        patient: patient?.userId,
        doctor: doctor?.userId,
      }
    }))

    return NextResponse.json({ appointments: appointmentsWithNames }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get appointments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'patient'])

    const body = await req.json()
    const validatedData = createAppointmentSchema.parse(body)

    await dbConnect()

    if (user.role === 'patient') {
      const Patient = (await import('@/models/Patient')).default
      const patient = await Patient.findOne({ userId: user.id })
      
      if (!patient) {
        return NextResponse.json(
          { error: 'Patient profile not found' },
          { status: 400 }
        )
      }

      if (validatedData.patientId !== (patient._id as any).toString()) {
        return NextResponse.json(
          { error: 'You can only create appointments for yourself' },
          { status: 403 }
        )
      }
    }

    const appointment = await Appointment.create({
      ...validatedData,
      appointmentDate: new Date(validatedData.appointmentDate),
      status: 'pending',
    })

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE',
      entity: 'Appointment',
      entityId: appointment._id as any,
      description: `New appointment booked`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: 'Appointment created successfully', appointment },
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

    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
