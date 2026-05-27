"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [initialView, setInitialView] = useState<"login" | "signup">("login");

  useEffect(() => {
    async function loadSessionAndProfile() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    }
    loadSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const openLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setInitialView("login");
    setShowModal(true);
  };

  const openSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    setInitialView("signup");
    setShowModal(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#07111c]/80 backdrop-blur-md border-b border-white/10 py-4">
        <div className="container mx-auto px-6 max-w-5xl flex items-center justify-between">
          <Link href="/" className="font-extrabold text-2xl tracking-wide text-gradient inline-block hover:opacity-90 transition">
            ZimForceX
          </Link>
          <nav className="flex items-center gap-6">
            {user ? (
              <>
                <Link href="/jobs" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                  Jobs
                </Link>
                {profile?.role === "employer" ? (
                  <>
                    <Link href="/jobs/post" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                      Post Job
                    </Link>
                    <Link href="/applications" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                      Applications
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/network" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                      Network
                    </Link>
                    <Link href="/learning" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                      Learning
                    </Link>
                    <Link href="/mentorship" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                      Mentorship
                    </Link>
                    <Link href="/gigs" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                      Gigs
                    </Link>
                    <Link href="/events" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                      Events
                    </Link>
                    <Link href="/community" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                      Community
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                  <Link href="/profile" className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition font-semibold text-sm">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-white/10 text-[#94a3b8] hover:text-white rounded-lg hover:bg-white/5 transition font-semibold text-sm"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                  Home
                </Link>
                <Link href="/#features" className="text-[#94a3b8] hover:text-white transition text-sm font-medium hidden sm:block">
                  Features
                </Link>
                <button
                  onClick={openLogin}
                  className="px-4 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5 transition font-semibold text-sm"
                >
                  Log in
                </button>
                <button
                  onClick={openSignup}
                  className="px-4 py-2 bg-gradient-to-r from-accent to-purple-600 text-white rounded-lg hover:opacity-90 transition font-semibold text-sm"
                >
                  Get Started
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {showModal && <AuthModal initialView={initialView} onClose={() => setShowModal(false)} />}
    </>
  );
}
