import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import AuditLog from '@/models/AuditLog'
import dbConnect from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['admin'])

    await dbConnect()

    const logs = await AuditLog.find({})
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .limit(100)

    // Map to include user data directly in the log object
    const logsWithUserData = logs.map(log => ({
      ...log.toObject(),
      user: log.userId ? {
        firstName: log.userId.firstName,
        lastName: log.userId.lastName,
        email: log.userId.email
      } : null
    }))

    return NextResponse.json({ logs: logsWithUserData }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}