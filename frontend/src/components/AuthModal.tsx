"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { X } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "info" });

    if (view === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md p-6 rounded-xl border border-white/10 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          {view === "signup" ? "Sign Up" : "Log In"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-surface border border-white/10 rounded-lg text-white placeholder-muted focus:outline-none focus:border-accent transition"
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-accent hover:bg-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
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
                className="text-accent hover:underline font-medium"
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
                className="text-accent hover:underline font-medium"
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
