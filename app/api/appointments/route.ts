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

    const aggregation: any = []

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user.id })
      if (!patient) {
        return NextResponse.json({ appointments: [] }, { status: 200 })
      }
      aggregation.push({ $match: { patientId: patient._id } })
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user.id })
      if (!doctor) {
        return NextResponse.json({ appointments: [] }, { status: 200 })
      }
      aggregation.push({ $match: { doctorId: doctor._id } })
    }

    if (status) {
      aggregation.push({ $match: { status: status } })
    }

    aggregation.push(
      { $sort: { appointmentDate: -1, startTime: -1 } },
      { $limit: 100 },
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

    const appointments = await Appointment.aggregate(aggregation)

    return NextResponse.json({ appointments }, { status: 200 })
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

// Handle appointment updates (status changes, etc.)
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor'])
    
    const { appointmentId, status, ...updateData } = await req.json()

    await dbConnect()

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Only allow the doctor who owns the appointment to update it
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user.id })
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return NextResponse.json(
          { error: 'You can only update appointments assigned to you' },
          { status: 403 }
        )
      }
    }

    // Update the appointment with new data
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { ...updateData },
      { new: true, runValidators: true }
    )

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: appointmentId,
      description: `Appointment status updated to ${updateData.status || status}`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: 'Appointment updated successfully', appointment: updatedAppointment },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Update appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}