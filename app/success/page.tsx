"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type Confirmation = {
  booking_code: string;
  interview_date: string;
  start_time: string;
  end_time: string;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const supabase = createClient();

  const [confirmation, setConfirmation] =
    useState<Confirmation | null>(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadConfirmation() {
      if (!code) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc(
        "get_booking_confirmation",
        {
          p_booking_code: code,
        }
      );

      if (error) {
        console.error("Confirmation error:", error);
        setLoading(false);
        return;
      }

      if (data?.[0]) {
        setConfirmation(data[0]);
      }

      setLoading(false);
    }

    loadConfirmation();
  }, [code]);

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatTime(time: string) {
    return time.slice(0, 5);
  }

  async function copyCode() {
    if (!confirmation?.booking_code) return;

    try {
      await navigator.clipboard.writeText(
        confirmation.booking_code
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] px-4 py-8 text-white sm:flex sm:items-center sm:justify-center sm:px-6">
      <div className="mx-auto w-full max-w-lg">

        {/* BRAND */}
        <div className="text-center">

          <img
            src="/securinets.jpg"
            alt="Securinets"
            className="mx-auto h-20 w-auto object-contain sm:h-24"
          />

          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 sm:h-20 sm:w-20">
            <span className="text-2xl text-blue-400 sm:text-3xl">
              ✓
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Interview Confirmed
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-400 sm:text-base">
            Your interview has been successfully booked.
          </p>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />

            <p className="mt-4 text-sm text-gray-500">
              Loading your interview details...
            </p>
          </div>
        )}

        {/* CONFIRMATION CARD */}
        {!loading && confirmation && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/20">

            <div className="border-b border-white/10 p-5 sm:p-6">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Your interview
              </p>

              <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5 text-center sm:p-6">

                <p className="text-sm font-medium text-gray-400">
                  {formatDate(
                    confirmation.interview_date
                  )}
                </p>

                <p className="mt-3 text-4xl font-bold tracking-tight text-blue-400 sm:text-5xl">
                  {formatTime(
                    confirmation.start_time
                  )}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  until{" "}
                  {formatTime(
                    confirmation.end_time
                  )}
                </p>

              </div>

            </div>

            {/* BOOKING CODE */}
            <div className="p-5 sm:p-6">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Booking code
                  </p>

                  <p className="mt-3 font-mono text-xl font-bold tracking-wider text-white sm:text-2xl">
                    {confirmation.booking_code}
                  </p>
                </div>

                <button
                  onClick={copyCode}
                  className="ml-4 shrink-0 rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-3 text-xs font-semibold text-gray-300 transition hover:border-blue-500/30 hover:text-blue-400 active:scale-95"
                >
                  {copied ? "Copied" : "Copy"}
                </button>

              </div>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                Keep this code. You may need it when checking your interview information.
              </p>

            </div>

            {/* IMPORTANT */}
            <div className="border-t border-white/10 bg-[#0e1522] px-5 py-4 sm:px-6">

              <div className="flex gap-3">

                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs text-blue-400">
                  i
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Don't forget your interview
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Save your booking code and arrive on time for your scheduled interview.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ERROR */}
        {!loading && code && !confirmation && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">

            <p className="text-sm font-medium text-red-400">
              We couldn't load your interview details.
            </p>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              Your booking code is:
            </p>

            <p className="mt-2 font-mono text-sm text-gray-300">
              {code}
            </p>

          </div>
        )}

        {/* ACTION */}
        <div className="mt-6">

          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold transition hover:bg-blue-500 active:scale-[0.98]"
          >
            Back to Securinets
          </Link>

        </div>

        {/* FOOTER */}
        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-gray-700">
          SECURINETS · ISET ZAGHOUAN
        </p>

      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0f19] px-6 text-white">
      <div className="text-center">

        <img
          src="/securinets.jpg"
          alt="Securinets"
          className="mx-auto h-20 w-auto object-contain"
        />

        <div className="mx-auto mt-8 h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />

        <p className="mt-4 text-sm text-gray-500">
          Loading your confirmation...
        </p>

      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
