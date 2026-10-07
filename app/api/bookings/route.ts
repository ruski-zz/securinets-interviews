import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const className = String(body.className || "").trim();
    const slotId = String(body.slotId || "").trim();

    if (!fullName || !email || !phone || !className || !slotId) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("book_interview", {
      p_full_name: fullName,
      p_email: email,
      p_phone: phone,
      p_class_name: className,
      p_slot_id: slotId,
    });

    if (error) {
      console.error("Booking error:", error);

      if (error.message.includes("SLOT_UNAVAILABLE")) {
        return NextResponse.json(
          { error: "This interview slot is no longer available." },
          { status: 409 }
        );
      }

      if (error.message.includes("SLOT_NOT_FOUND")) {
        return NextResponse.json(
          { error: "Interview slot not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Could not create the booking." },
        { status: 500 }
      );
    }

    const booking = data?.[0];

    if (!booking) {
      return NextResponse.json(
        { error: "Booking was not created." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingCode: booking.booking_code,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
