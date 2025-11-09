import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import Billing from '@/models/Billing'
import dbConnect from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin'])

    await dbConnect()

    const bills = await Billing.find({})
      .populate('patientId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100)

    // Map to include patient data directly in the bill object
    const billsWithPatientData = bills.map(bill => ({
      ...bill.toObject(),
      patient: bill.patientId ? {
        firstName: bill.patientId.firstName,
        lastName: bill.patientId.lastName,
        email: bill.patientId.email
      } : null
    }))

    return NextResponse.json({ bills: billsWithPatientData }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get billing records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing records' },
      { status: 500 }
    )
  }
}