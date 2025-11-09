import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Patient from '@/models/Patient'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'patient'])

    await dbConnect()

    const patient = await Patient.findById(params.id)

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (user.role === 'patient') {
      if (patient.userId.toString() !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (user.role === 'doctor') {
      const MedicalRecord = (await import('@/models/MedicalRecord')).default
      const hasAccess = await MedicalRecord.findOne({
        patientId: patient._id,
        doctorId: await (await import('@/models/Doctor')).default
          .findOne({ userId: user.id })
          .then((doc) => doc?._id),
      })

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You can only access patients you have treated' },
          { status: 403 }
        )
      }
    }

    await patient.populate('userId', 'firstName lastName email phone')

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'READ',
      entity: 'Patient',
      entityId: patient._id as any,
      description: `Viewed patient profile`,
    })

    return NextResponse.json({ patient }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get patient error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'patient'])

    const body = await req.json()

    await dbConnect()

    const patient = await Patient.findById(params.id)

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (user.role === 'patient') {
      if (patient.userId.toString() !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (user.role === 'doctor') {
      const MedicalRecord = (await import('@/models/MedicalRecord')).default
      const Doctor = (await import('@/models/Doctor')).default
      const doctor = await Doctor.findOne({ userId: user.id })
      
      const hasAccess = await MedicalRecord.findOne({
        patientId: patient._id,
        doctorId: doctor?._id,
      })

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You can only update patients you have treated' },
          { status: 403 }
        )
      }
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    )

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'UPDATE',
      entity: 'Patient',
      entityId: patient._id as any,
      description: `Updated patient profile`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: 'Patient updated successfully', patient: updatedPatient },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Update patient error:', error)
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    )
  }
}
