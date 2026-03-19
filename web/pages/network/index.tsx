import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import type { User } from '../../types'

interface Profile {
  id: string
  full_name: string
  bio: string
  location: string
  skills: string[]
  role: string
}

interface Connection {
  id: string
  sender_id: string
  receiver_id: string
  status: string
}

export default function NetworkPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [connections, setConnections] = useState<Map<string, Connection>>(new Map())
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'discover' | 'network'>('discover')

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    await loadConnections(user.id)
  }

  async function loadConnections(userId: string) {
    const { data: connectionsData } = await supabase
      .from('connections')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    const connectionsMap = new Map<string, Connection>()
    connectionsData?.forEach(conn => {
      const otherUserId = conn.sender_id === userId ? conn.receiver_id : conn.sender_id
      connectionsMap.set(otherUserId, conn)
    })
    setConnections(connectionsMap)
  }

  async function searchUsers(query: string) {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .or(`full_name.ilike.%${query}%,bio.ilike.%${query}%,skills.cs.{${query}}`)
      .limit(20)

    if (data && !error) {
      setSearchResults(data)
    }
    setLoading(false)
  }

  async function sendConnectionRequest(receiverId: string) {
    const { error } = await supabase
      .from('connections')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      })

    if (!error) {
      await loadConnections(user.id)
    }
  }

  function getConnectionStatus(profileId: string): string {
    const connection = connections.get(profileId)
    if (!connection) return 'none'

    if (connection.status === 'pending') {
      return connection.sender_id === user.id ? 'pending_sent' : 'pending_received'
    }
    return connection.status
  }

  function getActionButton(profile: Profile) {
    const status = getConnectionStatus(profile.id)

    switch (status) {
      case 'accepted':
        return (
          <button className="px-4 py-2 bg-green-100 text-green-800 text-sm rounded-md cursor-default">
            Connected
          </button>
        )
      case 'pending_sent':
        return (
          <button className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm rounded-md cursor-default">
            Request Sent
          </button>
        )
      case 'pending_received':
        return (
          <button className="px-4 py-2 bg-blue-100 text-blue-800 text-sm rounded-md cursor-default">
            Request Received
          </button>
        )
      default:
        return (
          <button
            onClick={() => sendConnectionRequest(profile.id)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            Connect
          </button>
        )
    }
  }

  const connectedUsers = searchResults.filter(profile => getConnectionStatus(profile.id) === 'accepted')
  const pendingUsers = searchResults.filter(profile => getConnectionStatus(profile.id).includes('pending'))

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
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
                <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">
                  Dashboard
                </Link>
                <Link href="/network" className="text-indigo-600 font-medium">
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
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/')
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('discover')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'discover'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Discover People
              </button>
              <button
                onClick={() => setActiveTab('network')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'network'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Network ({connectedUsers.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'discover' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Find Professionals</h2>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by name, skills, or bio..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchUsers(e.target.value)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => searchUsers(searchQuery)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            {loading && (
              <div className="text-center py-8">
                <div className="text-gray-500">Searching...</div>
              </div>
            )}

            {!loading && searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((profile) => (
                  <div key={profile.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-indigo-600">
                            {profile.full_name?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {profile.full_name || 'Anonymous User'}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                        </div>
                      </div>
                      {getActionButton(profile)}
                    </div>

                    {profile.bio && (
                      <p className="text-sm text-gray-600 mb-3 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                        {profile.bio}
                      </p>
                    )}

                    {profile.location && (
                      <p className="text-sm text-gray-500 mb-3">
                        📍 {profile.location}
                      </p>
                    )}

                    {profile.skills && profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            +{profile.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!loading && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-2">No users found</div>
                <div className="text-sm text-gray-400">
                  Try searching with different keywords
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Your Network</h2>
              {connectedUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {connectedUsers.map((profile) => (
                    <div key={profile.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-green-600">
                            {profile.full_name?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {profile.full_name || 'Anonymous User'}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                        </div>
                      </div>

                      {profile.bio && (
                        <p className="text-sm text-gray-600 mb-3 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                          {profile.bio}
                        </p>
                      )}

                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">Your network is empty</div>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                  >
                    Start Connecting
                  </button>
                </div>
              )}
            </div>

            {pendingUsers.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Pending Connections</h2>
                <div className="space-y-4">
                  {pendingUsers.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-yellow-600">
                            {profile.full_name?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{profile.full_name || 'Anonymous User'}</div>
                          <div className="text-sm text-gray-500">
                            {getConnectionStatus(profile.id) === 'pending_sent'
                              ? 'Request sent'
                              : 'Request received'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {getConnectionStatus(profile.id) === 'pending_sent'
                          ? 'Waiting for response'
                          : 'Check dashboard to respond'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}