"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Briefcase, Plus, X } from "lucide-react";

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState("ZWL");
  const [jobType, setJobType] = useState("full_time");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  
  // Required Skills array input
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [message, setMessage] = useState({ text: "", type: "info" });

  useEffect(() => {
    async function checkAuthAndRole() {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push("/jobs");
        return;
      }
      
      setUser(currentUser);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error || !profileData || profileData.role !== "employer") {
        setMessage({ text: "Access Denied: Only Employer profiles can post job opportunities.", type: "error" });
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setLoading(false);
    }
    checkAuthAndRole();
  }, [router]);

  const addSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    e?.preventDefault();
    const cleanSkill = skillInput.trim();
    if (cleanSkill && !skills.includes(cleanSkill)) {
      setSkills([...skills, cleanSkill]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || profile?.role !== "employer") return;

    setSubmitting(true);
    setMessage({ text: "", type: "info" });

    try {
      const { error } = await supabase
        .from("jobs")
        .insert({
          posted_by: user.id,
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          salary_max: salaryMax ? parseInt(salaryMax) : null,
          currency,
          job_type: jobType,
          experience_level: experienceLevel,
          skills_required: skills,
          status: "active",
        });

      if (error) throw error;

      setMessage({ text: "Job opportunity posted successfully!", type: "success" });
      setTimeout(() => {
        router.push("/jobs");
      }, 1500);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#94a3b8]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
        <p>Verifying access credentials...</p>
      </div>
    );
  }

  if (profile?.role !== "employer") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-[#94a3b8] mb-6 max-w-md">
          Only users with an **Employer** account can create and post job openings.
        </p>
        <Link href="/jobs" className="inline-flex items-center gap-2 text-accent hover:underline font-semibold">
          <ArrowLeft size={16} /> Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-10">
      <div className="container mx-auto px-6 max-w-3xl">
        
        {/* Back Link */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-white transition font-medium mb-8"
        >
          <ArrowLeft size={18} />
          Back to jobs
        </Link>

        {message.text && (
          <div className={`p-4 rounded-xl mb-8 text-sm text-center border ${
            message.type === "error"
              ? "bg-red-500/20 text-red-200 border-red-500/30"
              : "bg-green-500/20 text-green-200 border-green-500/30"
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-emerald-600"></div>

          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Briefcase size={28} className="text-green-400" />
            Post a Job Opening
          </h1>
          <p className="text-sm text-[#94a3b8] mb-8">
            Create a skills-first job posting. Job seekers will apply with verified certificates.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g., Senior React Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3.5 bg-[#07111c] border border-white/10 rounded-xl text-white placeholder:text-[#475569] text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Role Description *</label>
              <textarea
                rows={8}
                required
                placeholder="Detail the role, daily responsibilities, required experience, and expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 bg-[#07111c] border border-white/10 rounded-xl text-white placeholder:text-[#475569] text-sm focus:outline-none focus:border-accent resize-none leading-relaxed"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Location *</label>
              <input
                type="text"
                required
                placeholder="e.g., Harare, Bulawayo, Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3.5 bg-[#07111c] border border-white/10 rounded-xl text-white placeholder:text-[#475569] text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {/* Salary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Salary Min</label>
                <input
                  type="number"
                  placeholder="Min salary"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="w-full p-3.5 bg-[#07111c] border border-white/10 rounded-xl text-white placeholder:text-[#475569] text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Salary Max</label>
                <input
                  type="number"
                  placeholder="Max salary"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="w-full p-3.5 bg-[#07111c] border border-white/10 rounded-xl text-white placeholder:text-[#475569] text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-3.5 bg-[#07111c] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent"
                >
                  <option value="ZWL">ZWL (Zimbabwe Dollar)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
            </div>

            {/* Type & Level Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Job Type *</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full p-3.5 bg-[#07111c] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Experience Level *</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full p-3.5 bg-[#07111c] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>

            {/* Skills Tag input */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Required Skills *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-accent/20 border border-accent/40 text-blue-200 rounded-full text-xs flex items-center gap-2">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white transition">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., React, Node.js, Python"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  className="flex-1 p-3.5 bg-[#07111c] border border-white/10 rounded-xl text-white placeholder:text-[#475569] text-sm focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition font-bold text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
              >
                {submitting ? "Publishing Job..." : "Publish Job Listing"}
              </button>
              <Link
                href="/jobs"
                className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
