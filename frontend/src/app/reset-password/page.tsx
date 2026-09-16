"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkSession() {
      // Supabase recovery session sets active login state automatically when landing from reset link.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        setMessage({
          text: "Invalid or expired password reset link. Please request a new link.",
          type: "error",
        });
      }
      setLoading(false);
    }
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    setUpdating(true);
    setMessage({ text: "", type: "info" });

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({
          text: "Password reset successfully! Redirecting you to login/dashboard...",
          type: "success",
        });
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-16 px-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-md">
        <h1 className="text-2xl font-extrabold text-white text-center mb-2">Reset Password</h1>
        <p className="text-muted text-center text-sm mb-8">Enter your new secure password below.</p>

        {isAuthenticated ? (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#94a3b8]">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 bg-[#0c1929] border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#94a3b8]">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 pl-10 bg-[#0c1929] border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full p-3 bg-gradient-to-r from-accent to-purple-600 hover:opacity-95 text-white font-semibold rounded-lg transition disabled:opacity-50 mt-2 text-sm shadow-md"
            >
              {updating ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : (
          <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex flex-col items-center gap-2">
            <AlertTriangle size={32} />
            <span>{message.text}</span>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition"
            >
              Go to Home Page
            </button>
          </div>
        )}

        {message.text && isAuthenticated && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm text-center border flex items-center justify-center gap-2 ${
              message.type === "error"
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : "bg-green-500/20 text-green-400 border-green-500/30"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </main>
  );
}
