"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/logo";
import { MedicalBackground } from "@/components/landing/medical-background";
import { Button, Input, LoadingOverlay } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { recordLoginNotification } from "@/app/notifications/actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const noProfile = searchParams.get("error") === "no_profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        if (authError.message.includes("Email not confirmed")) {
          setError("Please confirm your email first. Check your inbox.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("Sign in failed — no session returned.");
        setLoading(false);
        return;
      }

      try {
        await recordLoginNotification();
      } catch {
        // Login still succeeds if notification insert fails
      }

      window.location.href = "/";
    } catch {
      setError("Network error — check your connection.");
      setLoading(false);
    }
  }

  return (
    <>
      <LoadingOverlay active={loading} message="loading" />
      <div className="relative flex min-h-screen min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
      <MedicalBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="form-container relative z-10"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex">
            <BrandLogo size="lg" />
          </Link>
          <p className="mt-4 text-sm text-slate-600">Sign in — patients, staff, and partners each land in the right portal</p>
        </div>

        <div className="rounded-2xl border border-medical-100 bg-white/90 p-6 shadow-xl shadow-medical-900/5 backdrop-blur-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900/90">
          {noProfile && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Your account exists but has no profile yet. Contact your administrator.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-medical-600 hover:bg-medical-700"
              disabled={loading}
            >
              Sign in
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            New patient?{" "}
            <Link href="/signup" className="font-semibold text-medical-600 hover:text-medical-700">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-medical-600">
            ← Back to homepage
          </Link>
        </p>
      </motion.div>
    </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
