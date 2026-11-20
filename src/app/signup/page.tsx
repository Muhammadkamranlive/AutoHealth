"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/logo";
import { MedicalBackground } from "@/components/landing/medical-background";
import { Button, Input, LoadingOverlay } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        setError("Check your email to confirm your account, then sign in.");
        setLoading(false);
        return;
      }

      if (data.user) {
        await supabase
          .from("profiles")
          .update({ first_name: firstName, last_name: lastName })
          .eq("id", data.user.id);
      }

      window.location.href = "/dashboard";
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
          <p className="mt-4 text-sm text-slate-600">Create a patient account and join this clinic</p>
        </div>

        <div className="rounded-2xl border border-medical-100 bg-white/90 p-6 shadow-xl shadow-medical-900/5 backdrop-blur-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900/90">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full bg-medical-600 hover:bg-medical-700" disabled={loading}>
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-medical-600 hover:text-medical-700">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Staff and partner accounts are created by your clinic administrator.
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-medical-600">
            ← Back to homepage
          </Link>
        </p>
      </motion.div>
    </div>
    </>
  );
}
