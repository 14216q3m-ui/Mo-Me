import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Brain } from "@/lib/guardian/brain"; 

export async function POST(req: NextRequest) {
  try {
    const { message, postId, effort, imageData, imageUrl, mode = 'chat' } = await req.json();
    if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

    // 1. ดึงบริบทตัวตน (Identity)
    const { data: identity } = await supabase.from("identity_vault").select("core_summary").limit(1).maybeSingle();

    // 2. ดึงประวัติ 15 ข้อความล่าสุด (รวมถึงรูปภาพที่เพิ่งอัปโหลดไปด้วย)
    const { data: history } = await supabase.from("post_updates")
      .select("role, update_text, image_url")
      .eq("post_id", postId)
      .not("update_text", "ilike", "%ระบบ Google%") 
      .not("update_text", "ilike", "%เมาน้ำมันเครื่อง%") 
      .order("created_at", { ascending: false })
      .limit(15);

    // ปรับ History ให้ฉลาดขึ้น: ถ้ามีรูป ให้บอก AI ด้วยว่าน้องส่งรูปมานะ
    const historyData = history?.reverse().map(h => {
      const sender = h.role === 'user' ? 'น้อง' : 'พี่';
      const text = h.update_text || (h.image_url ? "[ส่งรูปภาพเข้ามา]" : "");
      return `${sender}: ${text}`;
    }).join(" | ") || "";

    // 🛡️ ขั้นตอนที่ 3: (ตัดออก) ไม่ต้องบันทึกคำถามน้องซ้ำ เพราะบันทึกไปแล้วที่หน้า BrotherChat

    // 4. สั่งสมองทำงาน
    const brainRes = await Brain.analyze({ 
      message, 
      coreSummary: identity?.core_summary, 
      historyData,
      effort: Number(effort) || 5, 
      imageData, // ถ้ามี imageData ส่งมา (เช่น รูปใบสุดท้าย) AI ก็ยังวิเคราะห์ได้
      mode 
    });

    // 5. ระบบจัดการคำตอบสำรอง (Fallback)
    let finalReply = brainRes.reply;
    
    if (!brainRes.success) {
      finalReply = mode === 'greeting' 
        ? "เออ ว่าไงจิ๊กโก๋... วันนี้จะมาสลักอะไรเพิ่มล่ะ? (พี่มึนๆ นิดหน่อยนะ)" 
        : "เออ... เมื่อกี้พี่หน้ามืดว่ะ แกพูดว่าอะไรนะ ขออีกรอบดิ๊";
      
      return NextResponse.json({ reply: finalReply });
    }

    // 6. บันทึกคำตอบของพี่ชายลง DB (ใช้ content_type: 'chat')
    await supabase.from("post_updates").insert({
      post_id: postId, 
      role: "brother", 
      update_text: finalReply, 
      content_type: 'chat',
      created_at: new Date().toISOString() // ใส่เพื่อให้ลำดับเวลาแม่นยำ
    });

    return NextResponse.json({ reply: finalReply });

  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ reply: "เออ... พี่ขอไปพักเติมน้ำมันแป๊บนะ" });
  }
}