import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import dbConnect from '@/lib/mongodb'
import Prescription from '@/models/Prescription'
import PharmacyInventory from '@/models/PharmacyInventory'
import Patient from '@/models/Patient'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'doctor', 'pharmacist'])
    await dbConnect()

    // Extract the report type from query parameters
    const url = new URL(req.url)
    const reportType = url.searchParams.get('type')
    const role = user.role

    let reportData = null

    switch (reportType) {
      case 'dispensed-prescriptions':
        if (role === 'pharmacist' || role === 'admin') {
          reportData = await Prescription.find({ 
            status: 'dispensed',
            dispensedBy: role === 'pharmacist' ? user.id : { $exists: true }
          })
          .populate({
            path: 'patientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName email'
            }
          })
          .populate('doctorId', 'firstName lastName email')
          .populate('medicalRecordId', 'visitDate diagnosis')
          .sort({ dispensedDate: -1 })
        }
        break

      case 'inventory-report':
        if (role === 'pharmacist' || role === 'admin') {
          reportData = await PharmacyInventory.find({})
            .sort({ medicineName: 1 })
        }
        break

      case 'low-stock':
        if (role === 'pharmacist' || role === 'admin') {
          reportData = await PharmacyInventory.find({ 
            $expr: { $lte: [{ $toInt: "$quantity" }, { $toInt: "$reorderLevel" }] }
          })
            .sort({ quantity: 1 })
        }
        break

      case 'pending-prescriptions':
        if (role === 'pharmacist' || role === 'admin') {
          reportData = await Prescription.find({ status: 'pending' })
          .populate({
            path: 'patientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName email'
            }
          })
          .populate('doctorId', 'firstName lastName email')
          .populate('medicalRecordId', 'visitDate diagnosis')
          .sort({ issuedDate: -1 })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    if (reportData === null) {
      return NextResponse.json(
        { error: 'You do not have permission to generate this report' },
        { status: 403 }
      )
    }

    // Process the data based on report type for better presentation
    let processedData = reportData;
    
    switch (reportType) {
      case 'dispensed-prescriptions':
        // Format prescription data for reporting
        processedData = reportData.map((prescription: any) => ({
          id: prescription._id,
          patient: `${prescription.patientId?.userId?.firstName} ${prescription.patientId?.userId?.lastName}`,
          doctor: `Dr. ${prescription.doctorId?.firstName} ${prescription.doctorId?.lastName}`,
          medications: prescription.medications.map((med: any) => med.medicineName).join(', '),
          issuedDate: new Date(prescription.issuedDate).toLocaleDateString(),
          dispensedDate: new Date(prescription.dispensedDate).toLocaleDateString(),
          dispensedBy: prescription.dispensedBy ? `Pharmacist ID: ${prescription.dispensedBy}` : 'N/A',
        }));
        break;

      case 'pending-prescriptions':
        // Format pending prescription data
        processedData = reportData.map((prescription: any) => ({
          id: prescription._id,
          patient: `${prescription.patientId?.userId?.firstName} ${prescription.patientId?.userId?.lastName}`,
          doctor: `Dr. ${prescription.doctorId?.firstName} ${prescription.doctorId?.lastName}`,
          medications: prescription.medications.map((med: any) => med.medicineName).join(', '),
          issuedDate: new Date(prescription.issuedDate).toLocaleDateString(),
        }));
        break;

      case 'inventory-report':
        // Format inventory data
        processedData = reportData.map((item: any) => ({
          id: item._id,
          medicineName: item.medicineName,
          genericName: item.genericName,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          reorderLevel: item.reorderLevel,
          isLowStock: item.quantity <= item.reorderLevel,
          expiryDate: new Date(item.expiryDate).toLocaleDateString(),
        }));
        break;

      case 'low-stock':
        // Format low stock items
        processedData = reportData.map((item: any) => ({
          id: item._id,
          medicineName: item.medicineName,
          category: item.category,
          currentQuantity: item.quantity,
          reorderLevel: item.reorderLevel,
          shortage: item.reorderLevel - item.quantity,
          expiryDate: new Date(item.expiryDate).toLocaleDateString(),
        }));
        break;

      default:
        // Keep original structure for any other report types
        processedData = JSON.parse(JSON.stringify(reportData));
    }

    // Convert ObjectId to string for JSON serialization
    const serializedReport = JSON.parse(JSON.stringify(processedData));

    return NextResponse.json(
      { 
        reportType,
        data: serializedReport,
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        generatedByRole: user.role,
        count: serializedReport.length
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}