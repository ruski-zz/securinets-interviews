"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestDatabase() {
  const [status, setStatus] = useState("Testing connection...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("interview_days")
        .select("id")
        .limit(1);

      if (error) {
        setStatus(`Database error: ${error.message}`);
      } else {
        setStatus("Supabase connected successfully.");
      }
    }

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080d18] px-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#0d1422] p-10 text-center">
        <div className="text-sm tracking-[0.2em] text-blue-400">
          SECURINETS
        </div>

        <h1 className="mt-4 text-2xl font-bold">
          Database Connection
        </h1>

        <p className="mt-4 text-gray-400">
          {status}
        </p>
      </div>
    </main>
  );
}
