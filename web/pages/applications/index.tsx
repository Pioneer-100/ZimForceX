import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import type { User, Application } from '../../types'
  id: string
  job_id: string
  applicant_id: string
  cover_letter: string
  status: string
  created_at: string
  applicant_profile?: {
    full_name: string
    bio: string
    skills: string[]
  }
  job?: {
    title: string
  }
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [filter, setFilter] = useState('submitted')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && userRole === 'employer') {
      loadApplications()
    }
  }, [filter])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileData?.role !== 'employer') {
      router.push('/jobs')
      return
    }

    setUserRole(profileData.role)
    setLoading(false)
  }

  async function loadApplications() {
    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        applicant_profile:profiles!applicant_id(full_name, bio, skills),
        job:jobs(title)
      `)
      .eq('job.posted_by', user.id)

    if (data) {
      const filtered = filter === 'all' ? data : data.filter(app => app.status === filter)
      setApplications(filtered)
    }
  }

  async function updateApplicationStatus(applicationId: string, newStatus: string) {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId)

    if (!error) {
      await loadApplications()
    }
  }

  if (loading) {
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
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              ← Back to Dashboard
            </Link>
            <Link href="/jobs" className="text-gray-700 hover:text-indigo-600">
              View Jobs
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Applications</h1>

        {/* Filters */}
        <div className="mb-6 flex space-x-2">
          {['submitted', 'reviewed', 'accepted', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'All Applications' : status}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-medium text-indigo-600">
                        {(application.applicant_profile as any)?.full_name?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {(application.applicant_profile as any)?.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Applied for: <strong>{(application.job as any)?.title}</strong>
                      </p>
                      {(application.applicant_profile as any)?.bio && (
                        <p className="text-sm text-gray-600 mt-1">
                          {(application.applicant_profile as any).bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {application.status}
                  </span>
                </div>

                {/* Skills */}
                {(application.applicant_profile as any)?.skills && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Skills:</div>
                    <div className="flex flex-wrap gap-2">
                      {(application.applicant_profile as any).skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {application.cover_letter && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-700">
                      <strong>Cover Letter:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{application.cover_letter}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Applied {new Date(application.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'accepted')}
                      disabled={application.status === 'accepted'}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'rejected')}
                      disabled={application.status === 'rejected'}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'reviewed')}
                      disabled={application.status === 'reviewed'}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Mark Reviewed
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500">
              You haven't received any applications matching this filter
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
