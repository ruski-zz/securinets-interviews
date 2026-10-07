"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0f19] px-6 text-white">
      <div className="w-full max-w-md">

        <div className="mb-10 text-center">

          <img
            src="/securinets.jpg"
            alt="Securinets"
            className="mx-auto h-20 w-auto object-contain"
          />

          <h1 className="mt-6 text-3xl font-bold">
            Admin Portal
          </h1>

          <p className="mt-2 text-gray-500">
            Interview management dashboard
          </p>

        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-white/10 bg-[#111827] p-8"
        >

          <div>
            <label className="text-sm text-gray-400">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="admin@example.com"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm text-gray-400">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <p className="mt-6 text-center text-xs tracking-wider text-gray-600">
          SECURINETS · ISET ZAGHOUAN
        </p>

      </div>
    </main>
  );
}
