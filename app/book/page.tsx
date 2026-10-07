"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type InterviewDay = {
  id: string;
  interview_date: string;
};

type InterviewSlot = {
  id: string;
  interview_day_id: string;
  start_time: string;
  end_time: string;
  status: string;
};

export default function BookPage() {
  const router = useRouter();

  const [days, setDays] = useState<InterviewDay[]>([]);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [className, setClassName] = useState("");

  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDays() {
      const { data, error } = await supabase
        .from("interview_days")
        .select("id, interview_date")
        .eq("is_active", true)
        .order("interview_date");

      if (error) {
        setError(error.message);
      } else {
        setDays(data || []);
      }

      setLoadingDays(false);
    }

    loadDays();
  }, []);

  async function selectDate(day: InterviewDay) {
    setSelectedDate(day.interview_date);
    setSelectedSlot("");
    setSlots([]);
    setLoadingSlots(true);
    setError("");

    const { data, error } = await supabase
      .from("interview_slots")
      .select(
        "id, interview_day_id, start_time, end_time, status"
      )
      .eq("interview_day_id", day.id)
      .eq("status", "available")
      .order("start_time");

    if (error) {
      setError(error.message);
    } else {
      setSlots(data || []);
    }

    setLoadingSlots(false);
  }

  function formatDate(date: string) {
    const parsed = new Date(`${date}T12:00:00`);

    return {
      day: parsed
        .toLocaleDateString("en-US", {
          weekday: "short",
        })
        .toUpperCase(),

      date: parsed
        .toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
        })
        .toUpperCase(),
    };
  }

  function formatTime(time: string) {
    return time.slice(0, 5);
  }

  async function confirmBooking() {
    setError("");

    if (!fullName || !email || !phone || !className) {
      setError("Please complete all personal information.");
      return;
    }

    if (!selectedDate || !selectedSlot) {
      setError("Please select a date and time.");
      return;
    }

    setBooking(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          className,
          slotId: selectedSlot,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Booking failed.");
        setBooking(false);
        return;
      }

      router.push(`/success?code=${result.bookingCode}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setBooking(false);
    }
  }

  const selectedSlotData = slots.find(
    (slot) => slot.id === selectedSlot
  );

  return (
    <main className="min-h-screen bg-[#080d18] text-white">

      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <img
              src="/securinets.jpg"
              alt="Securinets"
              className="h-12 w-auto object-contain sm:h-14"
            />

            <div className="hidden sm:block">
              <div className="text-lg font-bold tracking-[0.2em]">
                SECURINETS
              </div>

              <div className="mt-1 text-[9px] tracking-[0.3em] text-blue-400">
                SEE BEYOND THE SCREEN
              </div>
            </div>
          </Link>

          <div className="text-right text-[10px] font-medium tracking-[0.15em] text-gray-500 sm:text-sm">
            INTERVIEW 2026
          </div>

        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">

        <div className="mb-8 sm:mb-10">

          <p className="text-xs font-medium tracking-[0.2em] text-blue-400 sm:text-sm">
            SECURINETS ISET ZAGHOUAN
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Book your interview
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-400 sm:mt-4 sm:text-base">
            Choose your preferred date and 10-minute interview slot.
          </p>

        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-5 text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-6 sm:space-y-8">

          {/* Personal information */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1422] p-5 sm:p-8">

            <h2 className="text-lg font-semibold sm:text-xl">
              Personal information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Tell us a little about yourself.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Full name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-white/10 bg-[#080d18] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#080d18] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Phone number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+216 XX XXX XXX"
                  className="w-full rounded-xl border border-white/10 bg-[#080d18] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Class / Group
                </label>

                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Example: 1ère année TI"
                  className="w-full rounded-xl border border-white/10 bg-[#080d18] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
                />
              </div>

            </div>
          </div>

          {/* Dates */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1422] p-5 sm:p-8">

            <h2 className="text-lg font-semibold sm:text-xl">
              Choose a date
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select your preferred interview day.
            </p>

            {loadingDays ? (
              <div className="mt-6 text-sm text-gray-500">
                Loading available dates...
              </div>
            ) : days.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
                No interview dates are currently available.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {days.map((day) => {
                  const date = formatDate(day.interview_date);
                  const selected =
                    selectedDate === day.interview_date;

                  return (
                    <button
                      key={day.id}
                      onClick={() => selectDate(day)}
                      className={`rounded-xl border p-4 text-center transition active:scale-[0.98] ${
                        selected
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-[#080d18] hover:border-blue-500/50"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-500">
                        {date.day}
                      </div>

                      <div
                        className={`mt-2 font-semibold ${
                          selected
                            ? "text-blue-400"
                            : "text-white"
                        }`}
                      >
                        {date.date}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1422] p-5 sm:p-8">

            <h2 className="text-lg font-semibold sm:text-xl">
              Choose a time
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Each interview lasts a maximum of 10 minutes.
            </p>

            {!selectedDate ? (
              <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
                Select a date first.
              </div>
            ) : loadingSlots ? (
              <div className="mt-6 text-sm text-gray-500">
                Loading available slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
                No available slots for this date.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {slots.map((slot) => {
                  const selected = selectedSlot === slot.id;

                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`rounded-xl border px-3 py-3 text-sm font-medium transition active:scale-[0.98] sm:px-4 ${
                        selected
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-white/10 bg-[#080d18] text-gray-300 hover:border-blue-500/50 hover:text-white"
                      }`}
                    >
                      {formatTime(slot.start_time)}
                      {" – "}
                      {formatTime(slot.end_time)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-semibold">
                  Your interview
                </h2>

                {selectedDate && selectedSlotData ? (
                  <p className="mt-2 text-sm text-gray-400">
                    {formatDate(selectedDate).date}
                    {" • "}
                    {formatTime(selectedSlotData.start_time)}
                    {" – "}
                    {formatTime(selectedSlotData.end_time)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    Select a date and time to continue.
                  </p>
                )}
              </div>

              <button
                onClick={confirmBooking}
                disabled={
                  booking ||
                  !fullName ||
                  !email ||
                  !phone ||
                  !className ||
                  !selectedDate ||
                  !selectedSlot
                }
                className="w-full rounded-xl bg-blue-500 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {booking
                  ? "Booking..."
                  : "Confirm interview →"}
              </button>

            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
