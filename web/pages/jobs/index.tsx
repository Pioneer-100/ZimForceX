import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

interface Job {
  id: string
  title: string
  description: string
  location: string
  salary_min: number
  salary_max: number
  currency: string
  job_type: string
  experience_level: string
  skills_required: string[]
  created_at: string
  posted_by_profile?: {
    full_name: string
  }
}

export default function JobsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    jobType: '',
    experienceLevel: '',
    location: ''
  })
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadJobs()
    }
  }, [filters, searchQuery])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)

    // Get user role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setUserRole(profileData.role)
    }
    setLoading(false)
  }

  async function loadJobs() {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        posted_by_profile:profiles!posted_by(full_name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.jobType) {
      query = query.eq('job_type', filters.jobType)
    }
    if (filters.experienceLevel) {
      query = query.eq('experience_level', filters.experienceLevel)
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    const { data } = await query.limit(50)
    if (data) {
      setJobs(data)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading jobs...</div>
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
                <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">
                  Dashboard
                </Link>
                <Link href="/network" className="text-gray-700 hover:text-indigo-600">
                  Network
                </Link>
                <Link href="/jobs" className="text-indigo-600 font-medium">
                  Jobs
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {userRole === 'employer' && (
                <Link
                  href="/jobs/post"
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 font-medium"
                >
                  Post a Job
                </Link>
              )}
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
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Jobs</h2>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by job title, skills, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
              <select
                value={filters.experienceLevel}
                onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                placeholder="e.g., Harare, Bulawayo"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Job Listings */}
        {jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 hover:text-indigo-600">
                        {job.title}
                      </h3>
                      <div className="text-sm text-gray-500 mt-1">
                        {(job.posted_by_profile as any)?.full_name || 'Company'}
                      </div>
                    </div>
                    <div className="text-right">
                      {job.salary_min && job.salary_max && (
                        <div className="font-semibold text-gray-900">
                          {job.currency} {job.salary_min.toLocaleString()}
                        </div>
                      )}
                      {!job.salary_min && (
                        <div className="text-sm text-gray-500">Salary negotiable</div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                      {job.job_type.replace('_', ' ')}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full capitalize">
                      {job.experience_level}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      📍 {job.location}
                    </span>
                  </div>

                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.skills_required.slice(0, 4).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills_required.length > 4 && (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">
                          +{job.skills_required.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 text-xs text-gray-500">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({ jobType: '', experienceLevel: '', location: '' })
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}