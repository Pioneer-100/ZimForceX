"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User, Camera, Plus, X, Upload, CheckCircle2, AlertTriangle, HelpCircle, FileText } from "lucide-react";

export default function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("entry");
  const [isPublic, setIsPublic] = useState(true);
  const [openToMentoring, setOpenToMentoring] = useState(false);
  
  // Dynamic Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Credentials (linked to public.credentials table)
  const [credentials, setCredentials] = useState<any[]>([]);
  const [certTitleInput, setCertTitleInput] = useState("");
  const certFileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState({ text: "", type: "info" });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // Load Profile Info
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setFullName(data.full_name || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
        setSkills(data.skills || []);
        setTargetRole(data.target_role || "");
        setExperienceLevel(data.experience_level || "entry");
        setIsPublic(data.is_public ?? true);
        setOpenToMentoring(data.open_to_mentoring ?? false);
      }

      // Load Credentials
      await fetchCredentials(currentUser.id);
    } catch (error: any) {
      console.error("Error fetching profile!", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCredentials(userId: string) {
    try {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (err: any) {
      console.error("Error fetching credentials:", err.message);
    }
  }

  // Handle Dynamic Skill additions
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

  // Handle File Uploads (Avatars & Certs)
  const uploadImageToStorage = async (file: File, folder: string) => {
    if (!user) return null;
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      setMessage({ text: `Upload failed: ${error.message}`, type: "error" });
      return null;
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setSaving(true);
    const file = e.target.files[0];
    const url = await uploadImageToStorage(file, "avatars");
    if (url) {
      setAvatarUrl(url);
    }
    setSaving(false);
  };

  const handleAddCertificate = async () => {
    if (!certTitleInput.trim() || !certFileInputRef.current?.files?.[0]) {
      setMessage({ text: "Please enter a certificate title and select a file.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage({ text: "Uploading file to storage...", type: "info" });
    
    const file = certFileInputRef.current.files[0];
    const url = await uploadImageToStorage(file, "certificates");
    
    if (url) {
      try {
        // 1. Insert record in credentials table
        const { data: newCred, error: credError } = await supabase
          .from("credentials")
          .insert({
            user_id: user.id,
            credential_type: "certificate",
            title: certTitleInput.trim(),
            issuing_organization: "Pending AI Extraction",
            document_url: url,
            verification_status: "pending",
          })
          .select()
          .single();

        if (credError) throw credError;

        setCertTitleInput("");
        if (certFileInputRef.current) certFileInputRef.current.value = "";
        
        // Optimistic local state update
        setCredentials(prev => [newCred, ...prev]);

        // 2. Proactively trigger AI verification endpoint (automatic trigger)
        setMessage({ text: "File uploaded successfully! Initiating automatic AI Verification...", type: "info" });

        const verifyRes = await fetch("/api/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credentialId: newCred.id }),
        });

        const verifyResult = await verifyRes.json();

        if (verifyResult.success) {
          setMessage({
            text: `Verification Complete: "${verifyResult.extractedTitle}" was verified with a confidence score of ${(verifyResult.confidenceScore * 100).toFixed(0)}%!`,
            type: "success",
          });
        } else {
          setMessage({
            text: `Verification Alert: ${verifyResult.error || "The document could not be fully verified by AI."}`,
            type: "error",
          });
        }
      } catch (err: any) {
        setMessage({ text: `Failed to complete credential pipeline: ${err.message}`, type: "error" });
      } finally {
        await fetchCredentials(user.id);
      }
    }
    setSaving(false);
  };

  const removeCertificate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("credentials")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setCredentials(credentials.filter((c) => c.id !== id));
      setMessage({ text: "Certificate removed successfully.", type: "success" });
    } catch (err: any) {
      setMessage({ text: `Failed to remove certificate: ${err.message}`, type: "error" });
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage({ text: "", type: "info" });

    try {
      const updates = {
        id: user.id,
        full_name: fullName,
        bio,
        skills,
        avatar_url: avatarUrl,
        target_role: targetRole,
        experience_level: experienceLevel,
        is_public: isPublic,
        open_to_mentoring: openToMentoring,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-20">Loading profile data...</div>;
  }

  if (!user) {
    return (
      <div className="text-white text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Please log in</h2>
        <p className="text-muted">You must be logged in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <form onSubmit={updateProfile} className="space-y-8">
      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-center border ${
          message.type === 'error' 
            ? 'bg-red-500/20 text-red-200 border-red-500/30' 
            : message.type === 'success'
            ? 'bg-green-500/20 text-green-200 border-green-500/30'
            : 'bg-blue-500/20 text-blue-200 border-blue-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/10">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-muted" />
            )}
          </div>
          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer">
            <Camera size={24} className="text-white" />
            <input type="file" accept="image/*" className="hidden" disabled={saving} onChange={handleAvatarUpload} />
          </label>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Profile Photo</h3>
          <p className="text-sm text-muted">Click the image to upload a new avatar.</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Full Name</label>
          <input
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Target Role</label>
          <input
            type="text"
            placeholder="e.g. Full Stack Developer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full p-3 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Experience Level</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full p-3 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent appearance-none"
          >
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior</option>
            <option value="executive">Executive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Professional Bio</label>
        <textarea
          rows={4}
          placeholder="Tell us about your career..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full p-3 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {/* Skills Section */}
      <div className="pb-6 border-b border-white/10">
        <label className="block text-sm font-semibold text-white mb-2">Your Skills</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill) => (
            <span key={skill} className="px-3 py-1 bg-accent/20 border border-accent/40 text-blue-200 rounded-full text-sm flex items-center gap-2">
              {skill}
              <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white transition">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a skill (e.g., React, Figma)"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={addSkill}
            className="w-full max-w-sm p-3 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent"
          />
          <button type="button" onClick={addSkill} className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-semibold">
            Add
          </button>
        </div>
      </div>

      {/* Certificates Section */}
      <div className="pb-6 border-b border-white/10">
        <label className="block text-sm font-semibold text-white mb-1">Supporting Certificates</label>
        <p className="text-xs text-muted mb-6">Attach credentials. Gemini AI will automatically extract and verify your skills in real time.</p>
        
        {credentials.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {credentials.map((cert) => (
              <div 
                key={cert.id} 
                className="p-5 bg-white/5 border border-white/10 rounded-xl relative flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="font-bold text-white text-sm leading-snug line-clamp-1">
                      {cert.title}
                    </span>
                    
                    <button 
                      type="button" 
                      onClick={() => removeCertificate(cert.id)} 
                      className="text-muted hover:text-red-400 p-1 bg-white/5 rounded transition"
                      title="Delete Certificate"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <a 
                      href={cert.document_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-white transition"
                    >
                      <FileText size={14} /> View File
                    </a>
                  </div>

                  {cert.issuing_organization && (
                    <div className="text-[11px] text-[#94a3b8] mb-1">
                      Issuer: <strong className="text-white">{cert.issuing_organization}</strong>
                    </div>
                  )}

                  {cert.verification_notes && (
                    <p className="text-[10px] text-[#475569] leading-relaxed mt-2 p-2 bg-black/15 rounded border border-white/5 whitespace-pre-wrap">
                      {cert.verification_notes}
                    </p>
                  )}
                </div>

                {/* Status Badges */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-[#475569]">AI Pipeline</span>
                  
                  {cert.verification_status === "verified" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold rounded-full">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  ) : cert.verification_status === "rejected" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-full">
                      <AlertTriangle size={10} /> Fraud Alert
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold rounded-full animate-pulse">
                      <HelpCircle size={10} /> Extracting...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-4 bg-black/20 rounded-xl border border-white/5">
          <input
            type="text"
            placeholder="Certificate Title (e.g., Advanced React)"
            value={certTitleInput}
            onChange={(e) => setCertTitleInput(e.target.value)}
            className="flex-1 p-3 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent min-w-[200px]"
          />
          <label className="cursor-pointer px-4 py-3 bg-surface border border-white/10 text-white rounded-lg hover:border-accent transition flex items-center gap-2">
            <Upload size={18} />
            <span className="text-sm">Select File</span>
            <input type="file" ref={certFileInputRef} accept="image/*,.pdf" className="hidden" />
          </label>
          <button
            type="button"
            onClick={handleAddCertificate}
            disabled={saving}
            className="px-4 flex items-center gap-1 py-3 bg-accent text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
          >
            <Plus size={18} /> {saving ? "..." : "Upload & Verify"}
          </button>
        </div>
      </div>

      {/* Privacy & Settings */}
      <div className="pb-6 border-b border-white/10 space-y-4">
        <label className="block text-sm font-semibold text-white mb-1">Privacy & Mentorship</label>
        <p className="text-xs text-muted mb-4">Control your visibility and networking preferences.</p>
        
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
          <div>
            <div className="font-semibold text-white text-sm">Public Profile</div>
            <div className="text-xs text-muted mt-1">Allow others to find you in the network</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent border border-white/10"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
          <div>
            <div className="font-semibold text-white text-sm">Open to Mentoring</div>
            <div className="text-xs text-muted mt-1">Show a badge indicating you are open to mentoring others</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={openToMentoring} onChange={(e) => setOpenToMentoring(e.target.checked)} />
            <div className="w-11 h-6 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent border border-white/10"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-accent to-purple-600 text-white rounded-xl hover:opacity-90 font-bold tracking-wide transition shadow-lg disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
