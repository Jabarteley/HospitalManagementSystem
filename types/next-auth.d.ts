import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'admin' | 'doctor' | 'patient' | 'pharmacist'
      email: string
      firstName: string
      lastName: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: 'admin' | 'doctor' | 'patient' | 'pharmacist'
    email: string
    firstName: string
    lastName: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'admin' | 'doctor' | 'patient' | 'pharmacist'
    email: string
    firstName: string
    lastName: string
  }
}
