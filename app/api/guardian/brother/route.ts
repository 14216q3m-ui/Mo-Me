import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // นำเข้าตัวสร้าง Client โดยตรง
import { Brain } from "@/lib/guardian/brain"; 

export async function POST(req: NextRequest) {
  try {
    // 1. สร้าง Supabase Admin สำหรับใช้งานฝั่ง Server (ข้าม RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // สำคัญมาก: ต้องใช้ Key นี้เท่านั้น
    );

    const { message, postId, effort, imageData, userId, mode = 'chat' } = await req.json();
    
    if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

    // 2. ดึงบริบทตัวตน (Identity) โดยใช้สิทธิ์ Admin
    const { data: identity } = await supabaseAdmin
      .from("identity_vault")
      .select("core_summary")
      .limit(1)
      .maybeSingle();

    // 3. ดึงประวัติ 15 ข้อความล่าสุด
    const { data: history } = await supabaseAdmin
      .from("post_updates")
      .select("role, update_text, image_url")
      .eq("post_id", postId)
      .not("update_text", "ilike", "%ระบบ Google%") 
      .not("update_text", "ilike", "%เมาน้ำมันเครื่อง%") 
      .order("created_at", { ascending: false })
      .limit(15);

    const historyData = history?.reverse().map(h => {
      const sender = h.role === 'user' ? 'น้อง' : 'พี่';
      const text = h.update_text || (h.image_url ? "[ส่งรูปภาพเข้ามา]" : "");
      return `${sender}: ${text}`;
    }).join(" | ") || "";

    // 4. สั่งสมอง (Gemini) ทำงาน
    const brainRes = await Brain.analyze({ 
      message, 
      coreSummary: identity?.core_summary, 
      historyData,
      effort: Number(effort) || 5, 
      imageData, 
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

    // 6. บันทึกคำตอบของพี่ชายลง DB โดยใช้สิทธิ์ Admin และระบุ userId
    await supabaseAdmin.from("post_updates").insert({
      post_id: postId, 
      role: "brother", 
      update_text: finalReply, 
      content_type: 'chat',
      user_id: userId, // บันทึกชื่อเล่นเพื่อให้ข้อมูลเชื่อมโยงกัน
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ reply: finalReply });

  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ reply: "เออ... พี่ขอไปพักเติมน้ำมันแป๊บนะ" }, { status: 500 });
  }
}