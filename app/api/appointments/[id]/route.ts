import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Appointment from '@/models/Appointment'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'completed', 'canceled']),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'patient'])

    await dbConnect()

    const appointment = await Appointment.findById(params.id)
      .populate('patientId')
      .populate('doctorId')

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (user.role === 'patient') {
      const Patient = (await import('@/models/Patient')).default
      const patient = await Patient.findOne({ userId: user.id })

      if (!patient || appointment.patientId._id.toString() !== patient._id.toString()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (user.role === 'doctor') {
      const Doctor = (await import('@/models/Doctor')).default
      const doctor = await Doctor.findOne({ userId: user.id })

      if (!doctor || appointment.doctorId._id.toString() !== doctor._id.toString()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ appointment }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'patient'])

    const body = await req.json()
    const validatedData = updateStatusSchema.parse(body)

    await dbConnect()

    const appointment = await Appointment.findById(params.id)

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (user.role === 'patient') {
      const Patient = (await import('@/models/Patient')).default
      const patient = await Patient.findOne({ userId: user.id })

      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return NextResponse.json(
          { error: 'You can only update your own appointments' },
          { status: 403 }
        )
      }

      if (validatedData.status !== 'canceled') {
        return NextResponse.json(
          { error: 'Patients can only cancel appointments' },
          { status: 403 }
        )
      }
    } else if (user.role === 'doctor') {
      const Doctor = (await import('@/models/Doctor')).default
      const doctor = await Doctor.findOne({ userId: user.id })

      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return NextResponse.json(
          { error: 'You can only update appointments assigned to you' },
          { status: 403 }
        )
      }
    }

    appointment.status = validatedData.status
    await appointment.save()

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: validatedData.status === 'approved' ? 'APPROVE' : validatedData.status === 'canceled' ? 'CANCEL' : 'UPDATE',
      entity: 'Appointment',
      entityId: appointment._id as any,
      description: `Appointment status changed to ${validatedData.status}`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: 'Appointment updated successfully', appointment },
      { status: 200 }
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

    console.error('Update appointment error:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}
