import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth(allowedRoles?: string[]) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }

  return user
}
