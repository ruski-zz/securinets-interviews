"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type BookingStatus =
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

type Booking = {
  id: string;
  booking_code: string;
  status: BookingStatus;
  created_at: string;
  applicants: {
    full_name: string;
    email: string;
    phone: string;
    class_name: string;
  } | null;
  interview_slots: {
    id: string;
    start_time: string;
    end_time: string;
    status: "available" | "booked" | "blocked";
    interview_days: {
      interview_date: string;
    } | null;
  } | null;
};

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "blocked";
  interview_days: {
    id: string;
    interview_date: string;
  } | null;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [slotUpdating, setSlotUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | BookingStatus
  >("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [scheduleDate, setScheduleDate] = useState("all");

  const [scheduleOpen, setScheduleOpen] = useState(true);

  async function loadData() {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/admin/login");
      return;
    }

    const [bookingsResult, slotsResult] = await Promise.all([
      supabase
        .from("bookings")
        .select(`
          id,
          booking_code,
          status,
          created_at,
          applicants (
            full_name,
            email,
            phone,
            class_name
          ),
          interview_slots (
            id,
            start_time,
            end_time,
            status,
            interview_days (
              interview_date
            )
          )
        `)
        .order("created_at", { ascending: false }),

      supabase
        .from("interview_slots")
        .select(`
          id,
          start_time,
          end_time,
          status,
          interview_days (
            id,
            interview_date
          )
        `)
        .order("start_time", { ascending: true }),
    ]);

    if (bookingsResult.error) {
      console.error(bookingsResult.error);
      setError("Could not load bookings.");
      setLoading(false);
      return;
    }

    if (slotsResult.error) {
      console.error(slotsResult.error);
      setError("Could not load interview slots.");
      setLoading(false);
      return;
    }

    /*
     * Supabase returns nested relationships as arrays in its
     * generated response type, while the database relationships
     * here are treated as single related records by the UI.
     *
     * The runtime shape is already verified by the dashboard,
     * so we intentionally bridge the TypeScript type here.
     */
    setBookings(
      (bookingsResult.data || []) as unknown as Booking[]
    );

    setSlots(
      (slotsResult.data || []) as unknown as Slot[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function updateStatus(
    bookingId: string,
    status: BookingStatus
  ) {
    setUpdating(bookingId);
    setError("");

    const { error } = await supabase.rpc(
      "update_booking_status",
      {
        p_booking_id: bookingId,
        p_status: status,
      }
    );

    if (error) {
      console.error(error);

      if (error.message.includes("NOT_ADMIN")) {
        setError(
          "You are not authorized to manage bookings."
        );
      } else {
        setError(
          "Could not update booking status."
        );
      }

      setUpdating(null);
      return;
    }

    await loadData();
    setUpdating(null);
  }

  async function updateSlot(
    slotId: string,
    status: "available" | "blocked"
  ) {
    setSlotUpdating(slotId);
    setError("");

    const { error } = await supabase.rpc(
      "update_slot_status",
      {
        p_slot_id: slotId,
        p_status: status,
      }
    );

    if (error) {
      console.error(error);

      if (error.message.includes("SLOT_BOOKED")) {
        setError(
          "This slot is already booked and cannot be blocked."
        );
      } else if (error.message.includes("NOT_ADMIN")) {
        setError(
          "You are not authorized to manage slots."
        );
      } else {
        setError(
          "Could not update the interview slot."
        );
      }

      setSlotUpdating(null);
      return;
    }

    await loadData();
    setSlotUpdating(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  const dates = useMemo(() => {
    return Array.from(
      new Set(
        bookings
          .map(
            (booking) =>
              booking.interview_slots?.interview_days
                ?.interview_date
          )
          .filter(Boolean)
      )
    ).sort() as string[];
  }, [bookings]);

  const scheduleDates = useMemo(() => {
    return Array.from(
      new Set(
        slots
          .map(
            (slot) =>
              slot.interview_days?.interview_date
          )
          .filter(Boolean)
      )
    ).sort() as string[];
  }, [slots]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const applicant = booking.applicants;

      const date =
        booking.interview_slots?.interview_days
          ?.interview_date;

      const matchesSearch =
        !query ||
        applicant?.full_name
          ?.toLowerCase()
          .includes(query) ||
        applicant?.email
          ?.toLowerCase()
          .includes(query) ||
        applicant?.phone
          ?.toLowerCase()
          .includes(query) ||
        applicant?.class_name
          ?.toLowerCase()
          .includes(query) ||
        booking.booking_code
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        booking.status === statusFilter;

      const matchesDate =
        dateFilter === "all" ||
        date === dateFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    bookings,
    search,
    statusFilter,
    dateFilter,
  ]);

  const filteredSlots = useMemo(() => {
    if (scheduleDate === "all") {
      return slots;
    }

    return slots.filter(
      (slot) =>
        slot.interview_days?.interview_date ===
        scheduleDate
    );
  }, [slots, scheduleDate]);

  const slotStats = useMemo(() => {
    const selected = filteredSlots;

    return {
      total: selected.length,
      available: selected.filter(
        (slot) => slot.status === "available"
      ).length,
      booked: selected.filter(
        (slot) => slot.status === "booked"
      ).length,
      blocked: selected.filter(
        (slot) => slot.status === "blocked"
      ).length,
    };
  }, [filteredSlots]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter(
        (b) => b.status === "confirmed"
      ).length,
      completed: bookings.filter(
        (b) => b.status === "completed"
      ).length,
      cancelled: bookings.filter(
        (b) => b.status === "cancelled"
      ).length,
      noShow: bookings.filter(
        (b) => b.status === "no_show"
      ).length,
    };
  }, [bookings]);

  function formatDate(date: string) {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(time: string) {
    return time.slice(0, 5);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0f19] text-white">
        <div className="text-center">
          <img
            src="/securinets.jpg"
            alt="Securinets"
            className="mx-auto h-16 w-auto object-contain"
          />

          <p className="mt-6 text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">

        {/* HEADER */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">

          <div className="flex items-center gap-4">
            <img
              src="/securinets.jpg"
              alt="Securinets"
              className="h-16 w-auto object-contain sm:h-20"
            />

            <div>
              <p className="text-xs font-semibold tracking-[0.3em] text-blue-400 sm:text-sm">
                SECURINETS
              </p>

              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Interview Dashboard
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Manage Securinets 2026 interview bookings.
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full rounded-xl border border-white/10 bg-[#111827] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-red-500/30 hover:text-red-400 md:w-auto"
          >
            Sign out
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="ml-4 text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {/* BOOKING STATS */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total bookings"
            value={stats.total}
          />

          <StatCard
            label="Confirmed"
            value={stats.confirmed}
          />

          <StatCard
            label="Completed"
            value={stats.completed}
          />

          <StatCard
            label="Cancelled"
            value={stats.cancelled}
          />

          <StatCard
            label="No-show"
            value={stats.noShow}
          />
        </div>

        {/* SCHEDULE */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">

          {/* SCHEDULE HEADER */}
          <div className="border-b border-white/10 px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <button
                type="button"
                onClick={() =>
                  setScheduleOpen((open) => !open)
                }
                className="flex flex-1 items-center justify-between text-left"
              >
                <div>
                  <h2 className="font-semibold">
                    Interview Schedule
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage available and blocked interview slots.
                  </p>
                </div>

                <span className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0b0f19] text-lg text-gray-400 transition hover:border-blue-500/30 hover:text-blue-400">
                  {scheduleOpen ? "−" : "+"}
                </span>
              </button>

              {scheduleOpen && (
                <select
                  value={scheduleDate}
                  onChange={(e) =>
                    setScheduleDate(e.target.value)
                  }
                  className="rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500/50"
                >
                  <option value="all">
                    All interview dates
                  </option>

                  {scheduleDates.map((date) => (
                    <option
                      key={date}
                      value={date}
                    >
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {scheduleOpen && (
            <>
              {/* SLOT STATS */}
              <div className="grid grid-cols-2 border-b border-white/10 md:grid-cols-4">

                <MiniStat
                  label="Total slots"
                  value={slotStats.total}
                />

                <MiniStat
                  label="Available"
                  value={slotStats.available}
                />

                <MiniStat
                  label="Booked"
                  value={slotStats.booked}
                />

                <MiniStat
                  label="Blocked"
                  value={slotStats.blocked}
                />
              </div>

              {/* SLOTS */}
              <div className="divide-y divide-white/5">

                {filteredSlots.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    No interview slots found.
                  </div>
                ) : (
                  filteredSlots.map((slot) => {

                    const isBooked =
                      slot.status === "booked";

                    const isBlocked =
                      slot.status === "blocked";

                    return (
                      <div
                        key={slot.id}
                        className="flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.02] sm:px-6 md:flex-row md:items-center md:justify-between"
                      >

                        <div className="flex items-center gap-4">

                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                              isBooked
                                ? "border-blue-500/20 bg-blue-500/10"
                                : isBlocked
                                ? "border-red-500/20 bg-red-500/10"
                                : "border-green-500/20 bg-green-500/10"
                            }`}
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isBooked
                                  ? "bg-blue-400"
                                  : isBlocked
                                  ? "bg-red-400"
                                  : "bg-green-400"
                              }`}
                            />
                          </div>

                          <div>
                            <p className="font-medium">
                              {formatTime(
                                slot.start_time
                              )}{" "}
                              –{" "}
                              {formatTime(
                                slot.end_time
                              )}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {slot.interview_days
                                ?.interview_date
                                ? formatDate(
                                    slot.interview_days
                                      .interview_date
                                  )
                                : "Unknown date"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">

                          <span
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                              isBooked
                                ? "border-blue-500/20 bg-blue-500/5 text-blue-400"
                                : isBlocked
                                ? "border-red-500/20 bg-red-500/5 text-red-400"
                                : "border-green-500/20 bg-green-500/5 text-green-400"
                            }`}
                          >
                            {isBooked
                              ? "Booked"
                              : isBlocked
                              ? "Blocked"
                              : "Available"}
                          </span>

                          {!isBooked && (
                            <button
                              disabled={
                                slotUpdating === slot.id
                              }
                              onClick={() =>
                                updateSlot(
                                  slot.id,
                                  isBlocked
                                    ? "available"
                                    : "blocked"
                                )
                              }
                              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 ${
                                isBlocked
                                  ? "border-green-500/20 text-green-400 hover:bg-green-500/10"
                                  : "border-red-500/20 text-red-400 hover:bg-red-500/10"
                              }`}
                            >
                              {slotUpdating === slot.id
                                ? "Updating..."
                                : isBlocked
                                ? "Unblock"
                                : "Block"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>

        {/* BOOKINGS */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">

          <div className="border-b border-white/10 px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="font-semibold">
                  Interview Bookings
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Showing {filteredBookings.length} of{" "}
                  {bookings.length} bookings.
                </p>
              </div>

              <button
                onClick={loadData}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-400 transition hover:border-blue-500/40 hover:text-blue-400"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <div className="border-b border-white/10 bg-[#0e1522] px-5 py-5 sm:px-6">

            <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search name, email, phone or booking code..."
                className="w-full rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500/50"
              />

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | BookingStatus
                  )
                }
                className="rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500/50"
              >
                <option value="all">
                  All statuses
                </option>

                <option value="confirmed">
                  Confirmed
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

                <option value="no_show">
                  No-show
                </option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value)
                }
                className="rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500/50"
              >
                <option value="all">
                  All dates
                </option>

                {dates.map((date) => (
                  <option
                    key={date}
                    value={date}
                  >
                    {formatDate(date)}
                  </option>
                ))}
              </select>

              <button
                onClick={clearFilters}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-400 transition hover:border-white/20 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>

          {/* BOOKING TABLE */}
          {filteredBookings.length === 0 ? (
            <div className="px-6 py-16 text-center">

              <p className="text-gray-500">
                No bookings match your filters.
              </p>

              {(search ||
                statusFilter !== "all" ||
                dateFilter !== "all") && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left">

                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-4">
                      Applicant
                    </th>

                    <th className="px-6 py-4">
                      Class
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4">
                      Time
                    </th>

                    <th className="px-6 py-4">
                      Code
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">

                  {filteredBookings.map((booking) => {

                    const applicant =
                      booking.applicants;

                    const slot =
                      booking.interview_slots;

                    const day =
                      slot?.interview_days;

                    return (
                      <tr
                        key={booking.id}
                        className="transition hover:bg-white/[0.02]"
                      >

                        <td className="px-6 py-5">
                          <div className="font-medium">
                            {applicant?.full_name ||
                              "Unknown"}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            {applicant?.email}
                          </div>

                          <div className="mt-1 text-xs text-gray-600">
                            {applicant?.phone}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-300">
                          {applicant?.class_name ||
                            "—"}
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-300">
                          {day?.interview_date
                            ? formatDate(
                                day.interview_date
                              )
                            : "—"}
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-300">
                          {slot
                            ? `${formatTime(
                                slot.start_time
                              )} – ${formatTime(
                                slot.end_time
                              )}`
                            : "—"}
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 font-mono text-xs text-blue-400">
                            {booking.booking_code}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <select
                            value={booking.status}
                            disabled={
                              updating === booking.id
                            }
                            onChange={(e) =>
                              updateStatus(
                                booking.id,
                                e.target
                                  .value as BookingStatus
                              )
                            }
                            className={`rounded-lg border bg-[#0b0f19] px-3 py-2 text-sm outline-none transition disabled:cursor-wait disabled:opacity-50 ${
                              booking.status ===
                              "confirmed"
                                ? "border-blue-500/30 text-blue-400"
                                : booking.status ===
                                  "completed"
                                ? "border-green-500/30 text-green-400"
                                : booking.status ===
                                  "cancelled"
                                ? "border-red-500/30 text-red-400"
                                : "border-yellow-500/30 text-yellow-400"
                            }`}
                          >
                            <option value="confirmed">
                              Confirmed
                            </option>

                            <option value="completed">
                              Completed
                            </option>

                            <option value="cancelled">
                              Cancelled
                            </option>

                            <option value="no_show">
                              No-show
                            </option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border-r border-white/10 px-6 py-5 last:border-r-0">
      <p className="text-xs uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}
