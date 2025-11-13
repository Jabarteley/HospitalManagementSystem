import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import MedicalRecord from '@/models/MedicalRecord'
import Patient from '@/models/Patient'
import Doctor from '@/models/Doctor'
import Appointment from '@/models/Appointment'
import User from '@/models/User'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const createMedicalRecordSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(), // Make optional since we set it automatically for doctors
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

    const aggregation: any = []

    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user.id })
      if (!doctor) {
        return NextResponse.json({ records: [] }, { status: 200 })
      }
      aggregation.push({ $match: { doctorId: doctor._id } })
    } else if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user.id })
      if (!patient) {
        return NextResponse.json({ records: [] }, { status: 200 })
      }
      aggregation.push({ $match: { patientId: patient._id } })
    }

    aggregation.push(
      { $sort: { visitDate: -1 } },
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

    const records = await MedicalRecord.aggregate(aggregation)

    return NextResponse.json({ records }, { status: 200 })
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
    console.log('Received medical record data:', body) // Debug log
    const validatedData = createMedicalRecordSchema.parse(body)
    console.log('Validated data:', validatedData) // Debug log

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

    // For doctors, automatically use their doctor profile ID
    // If no doctorId was provided in the request, use the authenticated user's doctor profile
    if (user.role === 'doctor') {
      const authDoctor = await Doctor.findOne({ userId: user.id });
      if (!authDoctor) {
        return NextResponse.json(
          { error: 'Doctor profile not found' },
          { status: 403 }
        );
      }
      doctorModelId = authDoctor._id;
    } else if (validatedData.doctorId) {
      // For admins, convert the provided doctorId to model ID if needed
      if (!mongoose.Types.ObjectId.isValid(validatedData.doctorId)) {
        const doctor = await Doctor.findOne({ userId: validatedData.doctorId });
        if (doctor) {
          doctorModelId = doctor._id;
        }
      } else {
        const existingDoctor = await Doctor.findById(validatedData.doctorId);
        if (!existingDoctor) {
          const doctor = await Doctor.findOne({ userId: validatedData.doctorId });
          if (doctor) {
            doctorModelId = doctor._id;
          }
        } else {
          doctorModelId = validatedData.doctorId;
        }
      }
    }

    // Check if there's an existing appointment for this patient on the visit date
    // that involves the same doctor
    let appointmentId = null;
    const possibleAppointments = await Appointment.find({
      patientId: patientModelId,
      doctorId: doctorModelId,
      appointmentDate: {
        $gte: new Date(new Date(validatedData.visitDate).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(validatedData.visitDate).setHours(23, 59, 59, 999))
      },
      status: { $ne: 'completed' } // Only consider non-completed appointments
    });

    // Find the most appropriate appointment
    if (possibleAppointments.length > 0) {
      // If the doctor is creating a record for today, and there's an appointment for today,
      // link it to the medical record
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayAppointment = possibleAppointments.find(app => {
        const appDate = new Date(app.appointmentDate);
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() === today.getTime();
      });
      
      if (todayAppointment) {
        appointmentId = todayAppointment._id;
        // Update the appointment status to completed
        await Appointment.findByIdAndUpdate(todayAppointment._id, { status: 'completed' });
      }
    }

    const record = await MedicalRecord.create({
      patientId: patientModelId,
      doctorId: doctorModelId,
      appointmentId: appointmentId, // Link to the appointment if found
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
      description: appointmentId 
        ? `New medical record created for appointment ${appointmentId}`
        : `New medical record created for patient`,
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