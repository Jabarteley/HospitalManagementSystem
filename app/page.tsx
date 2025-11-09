import Link from 'next/link'
import { Activity, Users, Calendar, Pill, FileText, ShieldCheck } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Activity className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Electronic Hospital Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Smart, Secure, and Efficient Healthcare Management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Patient Management"
            description="Complete patient registration, medical history, and profile management"
          />
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Appointment Scheduling"
            description="Easy booking system with doctor selection and status tracking"
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Electronic Health Records"
            description="Digital consultation notes, diagnosis, and treatment tracking"
          />
          <FeatureCard
            icon={<Pill className="w-8 h-8" />}
            title="Pharmacy Management"
            description="Prescription processing and inventory management system"
          />
          <FeatureCard
            icon={<Activity className="w-8 h-8" />}
            title="Billing & Payments"
            description="Automated invoice generation and payment tracking"
          />
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8" />}
            title="Audit Trail"
            description="Comprehensive logging of all critical system actions"
          />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Access Portal</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
