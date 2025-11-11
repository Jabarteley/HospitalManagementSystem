import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import PharmacyInventory from '@/models/PharmacyInventory'
import { requireAuth } from '@/lib/session'
import { createAuditLog } from '@/utils/auditLogger'

const createMedicineSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  genericName: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.string(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  reorderLevel: z.number().min(0, 'Reorder level cannot be negative').default(10),
  description: z.string().optional(),
  sideEffects: z.string().optional(), // Accept as string, convert to array in the route
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'pharmacist'])

    await dbConnect()

    const inventory = await PharmacyInventory.find({})
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })

    return NextResponse.json({ inventory }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get pharmacy inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pharmacy inventory' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'pharmacist'])

    const body = await req.json()
    const validatedData = createMedicineSchema.parse(body)

    await dbConnect()

    // Process sideEffects: if it's a string, split by comma; if it's already an array, use as is
    let processedSideEffects: string[] = [];
    if (typeof validatedData.sideEffects === 'string') {
      processedSideEffects = validatedData.sideEffects
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
    } else if (Array.isArray(validatedData.sideEffects)) {
      processedSideEffects = validatedData.sideEffects.filter(s => s && s.trim());
    }

    const medicine = await PharmacyInventory.create({
      ...validatedData,
      sideEffects: processedSideEffects,
      expiryDate: new Date(validatedData.expiryDate),
      createdBy: user.id,
    })

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'CREATE',
      entity: 'PharmacyInventory',
      entityId: medicine._id,
      description: `New medicine added: ${medicine.medicineName}`,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { message: 'Medicine added successfully', medicine },
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

    console.error('Create medicine error:', error)
    return NextResponse.json(
      { error: 'Failed to add medicine' },
      { status: 500 }
    )
  }
}