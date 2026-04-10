import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Memory } from "@/lib/guardian/memory";
import { Brain } from "@/lib/guardian/brain"; 

export async function POST(req: NextRequest) {
  try {
    // 🚩 รับ userId ที่ส่งมาจากหน้าบ้านด้วย
    const { postId, effort, userId } = await req.json();
    
    if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    // ถ้าไม่มี userId ให้ใช้ชื่อกลาง หรือเด้ง Error (ในกรณีนี้เราบังคับมีชื่อเล่น)
    const currentUserId = userId || "anonymous_jiggo";

    // 1. 🔍 หาจุดตัดเวลาล่าสุด (กรองตาม userId ของเจ้าของด้วย)
    const { data: lastSummaryRow } = await supabase
      .from("post_updates")
      .select("created_at")
      .eq("post_id", postId)
      .eq("user_id", currentUserId) // 🚩 กั้นห้อง
      .eq("content_type", "summary") 
      .order("created_at", { ascending: false })
      .limit(1);

    const lastSummaryTime = lastSummaryRow?.[0]?.created_at;

    // 2. 🔍 ดึงแชทและรูปภาพ (กรองตาม userId)
    let query = supabase.from("post_updates")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", currentUserId) // 🚩 กั้นห้อง
      .not("content_type", "in", '("summary","auto_summary")'); 

    if (lastSummaryTime) {
      query = query.gt("created_at", lastSummaryTime);
    }

    const { data: currentHistory } = await query.order("created_at", { ascending: true });
    
    if (!currentHistory || currentHistory.length === 0) {
      return NextResponse.json({ success: true, message: "ไม่มีบันทึกใหม่ให้จารึก" });
    }

    // 3. เตรียมประวัติการคุย
    const historyText = currentHistory
      .map(h => `${h.role === 'user' ? 'น้อง' : 'พี่'}: ${h.update_text || (h.image_url ? '[ส่งรูปภาพ]' : '')}`)
      .join("\n");

    // 4. สั่ง Brain ประมวลผล (API Key ของ Gemini จะถูกเรียกใช้ข้างใน Brain ซึ่งปลอดภัยเพราะอยู่บน Server)
    const brainResponse = await Brain.analyze({
      message: "ช่วยจารึกเนื้อแท้ของวันนี้ให้กูหน่อยพี่", 
      coreSummary: "นักสู้ที่กำลังเดินทางตามหาความหมาย", 
      historyData: historyText,
      effort: Number(effort) || 5,
      mode: 'finalize' 
    });

    const finalSummary = brainResponse.reply; 
    
    if (finalSummary) {
      // ✅ บันทึกลง Archive โดยใช้ userId ที่ส่งมาจากหน้าบ้าน
      // ไม่ต้องเช็ค auth.getUser() แล้ว เพราะเราใช้ระบบ Manual Identity
      await Memory.saveToArchive(currentUserId, finalSummary, Number(effort) || 5, postId, 'summary');
    }

    return NextResponse.json({ 
      success: true, 
      summary: finalSummary || "พี่จดความนิ่งของแกไว้ให้แล้วนะน้อง"
    });

  } catch (error: any) {
    console.error("❌ Finalize Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}