import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import type { Profile, Connection, User } from '../../types'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [router])

  async function checkUser(): Promise<void> {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!authUser) {
        router.push('/auth')
        return
      }
      setUser(authUser as User)
      await loadDashboardData(authUser.id)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function loadDashboardData(userId: string): Promise<void> {
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }
      if (profileData) {
        setProfile(profileData as Profile)
      }

      // Load connections (accepted)
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select(
          `*,
          sender_profile:profiles!sender_id(*),
          receiver_profile:profiles!receiver_id(*)`
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (connectionsError) throw connectionsError
      if (connectionsData) {
        setConnections(connectionsData as Connection[])
      }

      // Load pending connection requests (received)
      const { data: pendingData, error: pendingError } = await supabase
        .from('connections')
        .select(`*,sender_profile:profiles!sender_id(*)`)
        .eq('receiver_id', userId)
        .eq('status', 'pending')

      if (pendingError) throw pendingError
      if (pendingData) {
        setPendingRequests(pendingData as Connection[])
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
    }
  }

  async function handleConnectionResponse(connectionId: string, accept: boolean): Promise<void> {
    try {
      const status = accept ? 'accepted' : 'declined'
      const { error } = await supabase
        .from('connections')
        .update({ status })
        .eq('id', connectionId)

      if (error) throw error

      // Reload dashboard data
      if (user) {
        await loadDashboardData(user.id)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to respond to connection'
      setError(errorMessage)
    }
  }

  async function signOut(): Promise<void> {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out'
      setError(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={() => {
              setError(null)
              checkUser()
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                ZimForceX
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/network" className="text-gray-700 hover:text-indigo-600">
                  Network
                </Link>
                <Link href="/jobs" className="text-gray-700 hover:text-indigo-600">
                  Jobs
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-gray-700 hover:text-indigo-600">
                Profile
              </Link>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Summary</h2>
              {profile ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="font-medium">{profile.full_name || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="font-medium">{profile.location || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Role</div>
                    <div className="font-medium capitalize">{profile.role}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Skills</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No skills added</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-4">
                    <Link
                      href="/profile"
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Edit Profile →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">Complete your profile to get started</div>
                  <Link
                    href="/profile"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                  >
                    Set Up Profile
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Connection Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Connection Requests</h2>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {request.sender_profile?.full_name?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {request.sender_profile?.full_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Wants to connect with you
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleConnectionResponse(request.id, true)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleConnectionResponse(request.id, false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Network Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Your Network</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{connections.length}</div>
                  <div className="text-sm text-gray-500">Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{pendingRequests.length}</div>
                  <div className="text-sm text-gray-500">Pending Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-500">Profile Views</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/network"
                  className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Find Connections</div>
                    <div className="text-sm text-gray-500">Grow your professional network</div>
                  </div>
                </Link>

                <Link
                  href="/jobs"
                  className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Browse Jobs</div>
                    <div className="text-sm text-gray-500">Find your next opportunity</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}