import React from "react";
import ProfileForm from "@/components/ProfileForm";

export default function ProfilePage() {
  return (
    <main className="min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-white mb-2">Your Dashboard</h1>
        <p className="text-muted mb-10">Manage your skills-first profile and portfolio of certificates.</p>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 shadow-xl backdrop-blur-sm">
          <ProfileForm />
        </div>
      </div>
    </main>
  );
}
