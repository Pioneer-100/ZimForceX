import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import type { User, Job } from '../../types'

interface Application {
  id: string
  status: string
}

export default function JobDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState<User | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')

  useEffect(() => {
    if (id) {
      checkUser()
    }
  }, [id])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    await loadJob(id as string, user.id)
    setLoading(false)
  }

  async function loadJob(jobId: string, userId: string) {
    const { data: jobData } = await supabase
      .from('jobs')
      .select(`
        *,
        posted_by_profile:profiles!posted_by(full_name, bio)
      `)
      .eq('id', jobId)
      .single()

    if (jobData) {
      setJob(jobData)
    }

    // Check if user has already applied
    const { data: applicationData } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', jobId)
      .eq('applicant_id', userId)
      .single()

    if (applicationData) {
      setHasApplied(true)
    }
  }

  async function handleApply() {
    if (!user || !job) return

    setApplying(true)
    const { error } = await supabase
      .from('applications')
      .insert({
        job_id: job.id,
        applicant_id: user.id,
        cover_letter: coverLetter,
        status: 'submitted'
      })

    if (!error) {
      setHasApplied(true)
      setCoverLetter('')
      alert('Application submitted successfully!')
    } else {
      alert('Error submitting application: ' + error.message)
    }
    setApplying(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading job details...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h2>
          <Link href="/jobs" className="text-indigo-600 hover:text-indigo-800">
            Back to job listings
          </Link>
        </div>
      </div>
    )
  }

  const salaryRange = job.salary_min && job.salary_max
    ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    : 'Not specified'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/jobs" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              ← Back to Jobs
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
                    {job.job_type.replace('_', ' ')}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full capitalize">
                    {job.experience_level}
                  </span>
                  <span className="text-gray-500">📍 {job.location}</span>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About this job</h2>
                <div className="prose prose-sm text-gray-600 whitespace-pre-wrap mb-6">
                  {job.description}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-500">Salary</div>
                    <div className="font-semibold text-gray-900">{salaryRange}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Posted</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {job.skills_required && job.skills_required.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Required Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_required.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {job.posted_by_profile && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About the employer</h3>
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-indigo-600">
                        {(job.posted_by_profile as any).full_name?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {(job.posted_by_profile as any).full_name}
                      </div>
                      {(job.posted_by_profile as any).bio && (
                        <div className="text-sm text-gray-600">
                          {(job.posted_by_profile as any).bio}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Application Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-8">
              {hasApplied ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Applied!</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    You've already applied to this job. The employer will review your application soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleApply() }} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter
                    </label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Tell us why you're interested in this position..."
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={applying || !coverLetter.trim()}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {applying ? 'Submitting...' : 'Apply Now'}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    By applying, you agree to the platform's terms and conditions.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
