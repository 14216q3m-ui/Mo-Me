import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Brain } from "@/lib/guardian/brain";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId || userId === "undefined") return NextResponse.json({ message: "ยืนยันตัวตนก่อนจิ๊กโก๋..." });

    // 1. ดึงข้อมูล Post ล่าสุด
    const { data: latestPost } = await supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!latestPost) return NextResponse.json({ message: "เริ่มจารึกความพยายามก่อนเลยจิ๊กโก๋!" });

    // 2. เตรียมคำสั่ง
    const guardianInstruction = `คุณคือ "The Guardian" ตอบเป็น JSON เท่านั้น: { "message": "..." } โดยสรุปความเหนื่อยระดับ ${latestPost.effort}/10 ให้มีระดับ`;

    // 3. เรียกใช้สมอง
    const brainRes = await Brain.analyze({
      message: latestPost.text,
      coreSummary: guardianInstruction, 
      effort: latestPost.effort,
      mode: 'brief'
    });

    try {
      return NextResponse.json(JSON.parse(brainRes.reply));
    } catch {
      return NextResponse.json({ message: brainRes.reply });
    }
  } catch (error: any) {
    return NextResponse.json({ message: "พักผ่อนก่อนนะจิ๊กโก๋ เดี๋ยวพี่เฝ้าให้" });
  }
}