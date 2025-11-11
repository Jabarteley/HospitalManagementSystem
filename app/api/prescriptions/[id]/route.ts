import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Prescription from '@/models/Prescription'
import Patient from '@/models/Patient'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const updatePrescriptionSchema = z.object({
  status: z.enum(['pending', 'dispensed', 'canceled']),
  dispensedDate: z.string().optional(),
  dispensedBy: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(['admin', 'pharmacist'])
    const prescriptionId = params.id

    if (!prescriptionId) {
      return NextResponse.json(
        { error: 'Prescription ID is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    const body = await req.json()
    const validatedData = updatePrescriptionSchema.parse(body)

    // Check if the user is a pharmacist and if they're trying to change status to dispensed
    if (user.role === 'pharmacist' && validatedData.status === 'dispensed') {
      // Update the prescription status and set dispensed info
      const prescription = await Prescription.findByIdAndUpdate(
        prescriptionId,
        {
          status: validatedData.status,
          dispensedDate: validatedData.dispensedDate ? new Date(validatedData.dispensedDate) : new Date(),
          dispensedBy: user.id,
        },
        { new: true }
      )
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .populate('doctorId', 'firstName lastName email')
      .populate('medicalRecordId', 'visitDate diagnosis')

      if (!prescription) {
        return NextResponse.json(
          { error: 'Prescription not found' },
          { status: 404 }
        )
      }

      await createAuditLog({
        userId: user.id,
        userRole: user.role,
        action: 'UPDATE',
        entity: 'Prescription',
        entityId: prescription._id,
        description: `Prescription status updated to ${validatedData.status} by ${user.role}`,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      })

      return NextResponse.json(
        { message: 'Prescription updated successfully', prescription },
        { status: 200 }
      )
    } 
    // For admin or other status changes
    else if (user.role === 'admin') {
      const prescription = await Prescription.findByIdAndUpdate(
        prescriptionId,
        {
          status: validatedData.status,
          ...(validatedData.dispensedDate && { dispensedDate: new Date(validatedData.dispensedDate) }),
          ...(validatedData.dispensedBy && { dispensedBy: validatedData.dispensedBy }),
        },
        { new: true }
      )
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .populate('doctorId', 'firstName lastName email')
      .populate('medicalRecordId', 'visitDate diagnosis')

      if (!prescription) {
        return NextResponse.json(
          { error: 'Prescription not found' },
          { status: 404 }
        )
      }

      await createAuditLog({
        userId: user.id,
        userRole: user.role,
        action: 'UPDATE',
        entity: 'Prescription',
        entityId: prescription._id,
        description: `Prescription status updated to ${validatedData.status} by ${user.role}`,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      })

      return NextResponse.json(
        { message: 'Prescription updated successfully', prescription },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'Only pharmacists can dispense prescriptions and admins can make other changes' },
        { status: 403 }
      )
    }
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

    console.error('Update prescription error:', error)
    return NextResponse.json(
      { error: 'Failed to update prescription' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'pharmacist', 'patient'])

    const prescriptionId = params.id

    await dbConnect()

    // Build the query based on user role
    let query: any = { _id: prescriptionId }
    
    if (user.role === 'patient') {
      // Patients can only see their own prescriptions
      const patientProfile = await Patient.findOne({ userId: user.id })
      if (!patientProfile) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
      }
      query.patientId = patientProfile._id
    } else if (user.role === 'doctor') {
      // Doctors can see prescriptions related to their patients
      query.doctorId = user.id
    }

    const prescription = await Prescription.findOne(query)
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .populate('doctorId', 'firstName lastName email')
      .populate('medicalRecordId', 'visitDate diagnosis')

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    return NextResponse.json({ prescription }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get prescription error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prescription' },
      { status: 500 }
    )
  }
}