import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import MedicalRecord from '@/models/MedicalRecord'
import Patient from '@/models/Patient'
import Doctor from '@/models/Doctor'
import User from '@/models/User'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const createMedicalRecordSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  visitDate: z.string(),
  symptoms: z.array(z.string()),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  treatments: z.array(z.string()),
  consultationFee: z.number().min(0),
  status: z.enum(['open', 'closed']).default('open'),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'patient'])

    await dbConnect()

    let query: any = {}

    if (user.role === 'doctor') {
      // For doctors, find their doctor profile and use that ID
      const doctor = await Doctor.findOne({ userId: user.id });
      if (!doctor) {
        console.log('Doctor profile not found for user ID:', user.id)
        return NextResponse.json({ records: [] }, { status: 200 })
      }
      console.log('Looking for records for doctor ID:', doctor._id.toString())
      query.doctorId = doctor._id
    } else if (user.role === 'patient') {
      // Patients can only see their own records
      const patient = await Patient.findOne({ userId: user.id })
      if (!patient) {
        return NextResponse.json({ records: [] }, { status: 200 })
      }
      query.patientId = patient._id
    }

    // Fetch records with populated references
    const records = await MedicalRecord.find(query)
      .populate('patientId')
      .populate('doctorId')
      .populate('appointmentId', 'appointmentDate reason')
      .sort({ visitDate: -1 })

    // Add patient and doctor names to the response
    const recordsWithDetails = []
    for (const record of records) {
      const recordObj = record.toObject()
      
      // Get patient user details
      let patientUser = null;
      if (recordObj.patientId && recordObj.patientId.userId) {
        patientUser = await User.findById(recordObj.patientId.userId).select('firstName lastName email _id');
      }

      // Get doctor user details
      let doctorUser = null;
      if (recordObj.doctorId && recordObj.doctorId.userId) {
        doctorUser = await User.findById(recordObj.doctorId.userId).select('firstName lastName email _id');
      }

      recordsWithDetails.push({
        ...recordObj,
        patient: patientUser,
        doctor: doctorUser,
      })
    }

    return NextResponse.json({ records: recordsWithDetails }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get medical records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor'])

    const body = await req.json()
    const validatedData = createMedicalRecordSchema.parse(body)

    await dbConnect()

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
      // Check if it's already a patient model ID
      const existingPatient = await Patient.findById(validatedData.patientId);
      if (!existingPatient) {
        // If not a patient ID, assume it's a user ID
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
      // Check if it's already a doctor model ID
      const existingDoctor = await Doctor.findById(validatedData.doctorId);
      if (!existingDoctor) {
        // If not a doctor ID, assume it's a user ID
        const doctor = await Doctor.findOne({ userId: validatedData.doctorId });
        if (doctor) {
          doctorModelId = doctor._id;
        }
      } else {
        doctorModelId = validatedData.doctorId;
      }
    }

    // Validate that the authenticated user is authorized to create this record
    if (user.role === 'doctor') {
      const authDoctor = await Doctor.findOne({ userId: user.id });
      if (!authDoctor) {
        return NextResponse.json(
          { error: 'Doctor profile not found' },
          { status: 403 }
        );
      }
      // The doctor creating the record must match the doctor in the request
      if (authDoctor._id.toString() !== doctorModelId.toString()) {
        return NextResponse.json(
          { error: 'Doctor can only create records for themselves' },
          { status: 403 }
        );
      }
    }

    const record = await MedicalRecord.create({
      patientId: patientModelId,
      doctorId: doctorModelId,
      visitDate: new Date(validatedData.visitDate),
      symptoms: validatedData.symptoms,
      diagnosis: validatedData.diagnosis,
      treatments: validatedData.treatments,
      consultationFee: validatedData.consultationFee,
      status: validatedData.status,
      notes: validatedData.notes,
    })

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE',
      entity: 'MedicalRecord',
      entityId: record._id,
      description: `New medical record created for patient`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: 'Medical record created successfully', record },
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

    console.error('Create medical record error:', error)
    return NextResponse.json(
      { error: 'Failed to create medical record' },
      { status: 500 }
    )
  }
}