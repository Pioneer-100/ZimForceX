"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { X, Calendar, User, MapPin, Phone, Mail, Lock } from "lucide-react";

interface AuthModalProps {
  initialView: "login" | "signup";
  onClose: () => void;
}

export default function AuthModal({ initialView, onClose }: AuthModalProps) {
  const [view, setView] = useState<"login" | "signup">(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [loading, setLoading] = useState(false);

  // Additional Sign-up Fields
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("job_seeker");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "info" });

    if (view === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            dob: dob,
            gender: gender,
            location: location,
            phone_number: phoneNumber,
            role: role,
          },
        },
      });
      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "Check your email for confirmation!", type: "success" });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        onClose();
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: "Please enter your email address in the email field first.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "info" });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: `Password reset link sent to ${email}!`, type: "success" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-lg p-6 my-8 rounded-2xl border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          {view === "signup" ? "Create Your ZimForceX Account" : "Log In"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email field always visible */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#94a3b8]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 pl-10 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition text-sm"
              />
            </div>
          </div>

          {/* Password field always visible */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#94a3b8]">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pl-10 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition text-sm"
              />
            </div>
            {view === "login" && (
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-accent hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {/* Additional Signup Fields */}
          {view === "signup" && (
            <div className="space-y-4 pt-2 border-t border-white/5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#94a3b8]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 pl-10 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition text-sm"
                  />
                </div>
              </div>

              {/* Account Role Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#94a3b8]">Account Type</label>
                <select
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent transition text-sm h-[46px] appearance-none cursor-pointer"
                >
                  <option value="job_seeker">Job Seeker (Looking for opportunities)</option>
                  <option value="employer">Employer (Hiring & posting jobs)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#94a3b8]">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full p-3 pl-10 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition text-sm appearance-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#94a3b8]">Gender</label>
                  <select
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-3 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent transition text-sm appearance-none h-[46px]"
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#94a3b8]">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      type="text"
                      placeholder="e.g. Harare, Zimbabwe"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-3 pl-10 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#94a3b8]">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      type="tel"
                      placeholder="e.g. +263 77 123 4567"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full p-3 pl-10 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-gradient-to-r from-accent to-purple-600 hover:opacity-95 text-white font-semibold rounded-lg transition disabled:opacity-50 mt-2 text-sm shadow-md"
          >
            {loading ? "Please wait..." : view === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {view === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setView("login");
                  setMessage({ text: "", type: "info" });
                }}
                className="text-accent hover:underline font-semibold"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setView("signup");
                  setMessage({ text: "", type: "info" });
                }}
                className="text-accent hover:underline font-semibold"
              >
                Sign up
              </button>
            </>
          )}
        </p>

        {message.text && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm text-center border ${
              message.type === "error"
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : message.type === "success"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
