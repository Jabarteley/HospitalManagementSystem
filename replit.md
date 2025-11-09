# Electronic Hospital Management System (EHMS)

## Overview
A comprehensive web-based Electronic Clinic/Hospital Management System built with Next.js 14 and MongoDB. The system manages hospital operations digitally including patient registration, appointment booking, electronic health records (EHR), prescriptions, pharmacy operations, billing, and audit tracking.

## Tech Stack
- **Frontend**: Next.js 14 (React) with TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with JWT
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## User Roles
1. **Admin**: Full system access, manage staff, configure system
2. **Doctor**: Access patient records, consultations, prescriptions
3. **Patient**: Medical profile, book appointments, view prescriptions, pay bills
4. **Pharmacist**: Manage inventory, dispense medication, view prescriptions

## Core Features (MVP)
- ✅ Role-based authentication with JWT
- ✅ Patient management (registration, profiles, medical history, allergies)
- ✅ Appointment scheduling with status tracking
- ✅ Electronic Health Records (EHR) with consultation notes
- ✅ Digital prescription workflow
- ✅ Pharmacy inventory management with low-stock alerts
- ✅ Billing and invoice generation
- ✅ Audit trail logging for all critical actions

## Project Structure
```
hospital-management-system/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── patients/             # Patient management
│   │   ├── appointments/         # Appointment scheduling
│   │   ├── medical-records/      # EHR endpoints
│   │   ├── prescriptions/        # Prescription management
│   │   ├── pharmacy/             # Pharmacy inventory
│   │   ├── billing/              # Billing and payments
│   │   └── audit-logs/           # Audit trail
│   ├── auth/                     # Auth pages (login, register)
│   ├── patient/                  # Patient portal
│   ├── doctor/                   # Doctor dashboard
│   ├── pharmacy/                 # Pharmacy dashboard
│   ├── admin/                    # Admin portal
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global styles
├── models/                       # Mongoose models
│   ├── User.ts
│   ├── Patient.ts
│   ├── Doctor.ts
│   ├── Appointment.ts
│   ├── MedicalRecord.ts
│   ├── Prescription.ts
│   ├── PharmacyInventory.ts
│   ├── Billing.ts
│   └── AuditLog.ts
├── lib/                          # Utilities
│   └── mongodb.ts                # Database connection
├── components/                   # React components
│   └── ui/                       # UI components
└── utils/                        # Helper functions

```

## Database Models
1. **User**: Authentication & role management
2. **Patient**: Patient profiles & medical details
3. **Doctor**: Doctor profiles & specializations
4. **Appointment**: Booking schedule & status
5. **MedicalRecord**: Consultation notes & history
6. **Prescription**: Medicine details
7. **PharmacyInventory**: Drug stock management
8. **Billing**: Payment tracking & invoices
9. **AuditLog**: Audit trail for compliance

## Environment Variables Required
- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Secret for JWT signing
- `NEXTAUTH_URL`: Application URL (default: http://localhost:5000)

## Development Commands
- `npm run dev`: Start development server on port 5000
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint

## Recent Changes
- November 9, 2025: Initial project setup with Next.js 14, TypeScript, Tailwind CSS
- Created basic project structure and configuration files
- Set up homepage with feature overview

## Next Steps
- Set up MongoDB connection and Mongoose models
- Implement NextAuth.js authentication
- Create API routes for all modules
- Build user interfaces for different portals
