import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Brain } from "@/lib/guardian/brain"; // 🧠 ใช้สมองตัวกลางตัวเดิม

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id, text, effort, userId, reflection } = await req.json();

    // 🏛️ 1. ดึงมรดกความเพียร (Legacy) มาเทียบ
    const { data: legacyData } = await supabase
      .from("posts")
      .select("text, effort_level, created_at")
      .eq("user_id", userId)
      .neq("id", id) 
      .order("created_at", { ascending: false })
      .limit(10);

    let legacyContext = "นี่คือบันทึกหน้าแรกของคุณในจดหมายเหตุนี้";
    if (legacyData && legacyData.length > 0) {
      const maxEffort = legacyData.reduce((prev, curr) => (curr.effort_level > prev.effort_level) ? curr : prev);
      legacyContext = `
        - จุดสูงสุดที่เคยสู้ไว้: ${maxEffort.effort_level}% ("${maxEffort.text}")
        - ประวัติที่พี่จำได้: ${legacyData.slice(0, 3).map(p => p.text).join(", ")}
      `;
    }

    // 🏛️ 2. เตรียมคำสั่งให้พี่ชาย (ร่าง Guardian)
    const guardianInstruction = `
      คุณคือ "พี่ชาย" ของจิ๊กโก๋ ภารกิจคือ "จารึกสรุปทัชใจ" 
      อดีตที่พี่จำได้: ${legacyContext}
      
      บันทึกปัจจุบัน: "${text}"
      สิ่งที่น้องบอกตัวเอง (Reflection): "${reflection || "ไม่ได้ระบุ"}"
      
      กฎการจารึก:
      1. ห้ามภาษากวี ห้ามหุ่นยนต์ ให้คุยเหมือนพี่คุยกับน้อง
      2. ใช้ข้อมูลจาก Reflection ทักเขาด้วย (เช่น "แกบอกว่าแกเริ่มเฉยๆ พี่ว่านี่แหละคือความนิ่ง")
      3. เปรียบเทียบอดีตเพื่อให้เห็นการเติบโต
      4. ตอบเป็น JSON เท่านั้น: { "whisper": "...", "sentiment": "Pride | Sanctuary | Brave | Neutral" }
    `;

    // 🧠 3. เรียกใช้ Brain (โหมด Whisper/Finalize)
    const brainRes = await Brain.analyze({
      message: text,
      coreSummary: guardianInstruction,
      effort: effort,
      mode: 'finalize' // ใช้โหมดสรุป
    });

    // --- 🔍 4. จัดการ Response จาก Brain ---
    let aiResponse;
    try {
      // พยายามแกะ JSON ที่ออกมาจาก Brain
      aiResponse = JSON.parse(brainRes.reply);
    } catch {
      // ถ้า Brain ตอบมาเป็นข้อความธรรมดา (ไม่เป็น JSON)
      aiResponse = { 
        whisper: brainRes.reply, 
        sentiment: "Neutral" 
      };
    }

    // 💾 5. บันทึกจารึกลงใน post_updates
    if (id) {
      await supabase.from("post_updates").insert({
        post_id: id,
        role: "brother",
        update_text: aiResponse.whisper,
        content_type: 'summary'
      });
    }

    return NextResponse.json(aiResponse);

  } catch (error: any) {
    console.error("🔴 Guardian Whisper Error:", error);
    return NextResponse.json({ 
      whisper: "พี่จดไว้ให้แล้วนะ ความนิ่งของแกวันนี้พี่เห็นทั้งหมดแล้ว", 
      sentiment: "Neutral" 
    });
  }
}