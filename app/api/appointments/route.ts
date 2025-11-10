import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Appointment from '@/models/Appointment'
import Patient from '@/models/Patient'
import Doctor from '@/models/Doctor'
import User from '@/models/User'
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
      const patient = await Patient.findOne({ userId: user.id })
      if (!patient) {
        return NextResponse.json({ appointments: [] }, { status: 200 })
      }
      query.patientId = patient._id
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user.id })
      if (!doctor) {
        console.log('Doctor profile not found for user ID:', user.id)
        return NextResponse.json({ appointments: [] }, { status: 200 })
      }
      console.log('Doctor profile found:', doctor._id.toString())
      query.doctorId = doctor._id
    }
    // Admins and nurses can see all appointments or we can limit nurses to only see appointments for patients they're managing

    if (status) {
      query.status = status
    }

    // First, get appointments with populated patient and doctor IDs
    const appointments = await Appointment.find(query)
      .populate('patientId')
      .populate('doctorId')
      .sort({ appointmentDate: -1, startTime: -1 })
      .limit(100)

    // Then fetch user details separately for each appointment
    const appointmentsWithDetails = []
    for (const appointment of appointments) {
      const appointmentObj = appointment.toObject()
      
      // Get patient user details
      let patientUser = null;
      if (appointmentObj.patientId && appointmentObj.patientId.userId) {
        patientUser = await User.findById(appointmentObj.patientId.userId).select('firstName lastName email _id');
      }

      // Get doctor user details
      let doctorUser = null;
      if (appointmentObj.doctorId && appointmentObj.doctorId.userId) {
        doctorUser = await User.findById(appointmentObj.doctorId.userId).select('firstName lastName email _id');
      }

      appointmentsWithDetails.push({
        ...appointmentObj,
        patient: patientUser,
        doctor: doctorUser,
      })
    }

    return NextResponse.json({ appointments: appointmentsWithDetails }, { status: 200 })
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

    // Convert user IDs to model IDs if needed
    let patientModelId = validatedData.patientId;
    let doctorModelId = validatedData.doctorId;
    
    // If patientId is a user ID, find the corresponding patient model ID
    if (!mongoose.Types.ObjectId.isValid(validatedData.patientId)) {
      const patient = await Patient.findOne({ userId: validatedData.patientId });
      if (patient) {
        patientModelId = patient._id;
      }
    } else {
      // Check if it's already a patient model ID by trying to find it
      const existingPatient = await Patient.findById(validatedData.patientId);
      if (!existingPatient) {
        // If it's not a patient ID, assume it's a user ID and try to find the patient
        const patient = await Patient.findOne({ userId: validatedData.patientId });
        if (patient) {
          patientModelId = patient._id;
        }
      } else {
        patientModelId = validatedData.patientId;
      }
    }

    // If doctorId is a user ID, find the corresponding doctor model ID
    if (!mongoose.Types.ObjectId.isValid(validatedData.doctorId)) {
      const doctor = await Doctor.findOne({ userId: validatedData.doctorId });
      if (doctor) {
        doctorModelId = doctor._id;
      }
    } else {
      // Check if it's already a doctor model ID by trying to find it
      const existingDoctor = await Doctor.findById(validatedData.doctorId);
      if (!existingDoctor) {
        // If it's not a doctor ID, assume it's a user ID and try to find the doctor
        const doctor = await Doctor.findOne({ userId: validatedData.doctorId });
        if (doctor) {
          doctorModelId = doctor._id;
        }
      } else {
        doctorModelId = validatedData.doctorId;
      }
    }

    const appointment = await Appointment.create({
      patientId: patientModelId,
      doctorId: doctorModelId,
      appointmentDate: new Date(validatedData.appointmentDate),
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      reason: validatedData.reason,
      notes: validatedData.notes,
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