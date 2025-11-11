'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, FileText, Users, Calendar, Pill, Package, Download, BarChart3 } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && !['admin', 'doctor', 'pharmacist'].includes(session.user.role)) {
      router.push('/dashboard')
    }
  }, [status, router, session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || !['admin', 'doctor', 'pharmacist'].includes(session.user.role)) {
    return null
  }

  // Define available reports based on user role
  const getAvailableReports = () => {
    switch (session.user.role) {
      case 'admin':
        return [
          { 
            title: 'Patient Statistics', 
            description: 'Overview of patient demographics and statistics',
            icon: Users,
            reportType: 'patient-statistics'
          },
          { 
            title: 'Appointment Summary', 
            description: 'Detailed report on appointments',
            icon: Calendar,
            reportType: 'appointment-summary'
          },
          { 
            title: 'Prescription Records', 
            description: 'All prescriptions issued and dispensed',
            icon: Pill,
            reportType: 'prescription-records'
          },
          { 
            title: 'Inventory Report', 
            description: 'Current stock and reorder levels',
            icon: Package,
            reportType: 'inventory-report'
          },
          { 
            title: 'Financial Report', 
            description: 'Revenue and expense analysis',
            icon: BarChart3,
            reportType: 'financial-report'
          },
        ]
      case 'doctor':
        return [
          { 
            title: 'My Patient Reports', 
            description: 'Statistics on your patients',
            icon: Users,
            reportType: 'my-patients'
          },
          { 
            title: 'My Prescriptions', 
            description: 'Prescriptions you have issued',
            icon: Pill,
            reportType: 'my-prescriptions'
          },
          { 
            title: 'Appointment Summary', 
            description: 'Your appointments overview',
            icon: Calendar,
            reportType: 'my-appointments'
          },
        ]
      case 'pharmacist':
        return [
          { 
            title: 'Dispensed Prescriptions', 
            description: 'Prescriptions you have dispensed',
            icon: Pill,
            reportType: 'dispensed-prescriptions'
          },
          { 
            title: 'Inventory Report', 
            description: 'Current stock and reorder levels',
            icon: Package,
            reportType: 'inventory-report'
          },
          { 
            title: 'Low Stock Alert', 
            description: 'Items below reorder level',
            icon: Package,
            reportType: 'low-stock'
          },
        ]
      default:
        return []
    }
  }

  const availableReports = getAvailableReports()

  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleGenerateReport = async (reportType: string) => {
    setGeneratingReport(reportType);
    setReportError(null);
    
    try {
      const response = await fetch(`/api/reports?type=${reportType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
      
      // Create a downloadable file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      setReportError(error.message);
    } finally {
      setGeneratingReport(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">
            Generate and view reports based on your role and permissions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableReports.map((report, index) => {
            const Icon = report.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {report.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {report.description}
                </p>
                <button
                  onClick={() => handleGenerateReport(report.reportType)}
                  disabled={generatingReport === report.reportType}
                  className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    generatingReport === report.reportType 
                      ? 'bg-blue-400' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {generatingReport === report.reportType ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {reportError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{reportError}</p>
          </div>
        )}

        {availableReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reports available for your role</p>
            <p className="text-sm text-gray-400 mt-2">Contact your administrator for access</p>
          </div>
        )}
      </div>
    </div>
  )
}