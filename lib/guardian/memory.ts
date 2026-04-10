import { supabase } from "@/lib/supabase"; 

// 🚩 จำเป็น: ใส่ API Key ของ Gemini (หรือจะย้ายไปไว้ใน .env ก็ได้เพื่อความปลอดภัย)
const API_KEY = "AIzaSyCt8FrjCAT4XRVF-x25iC21xMKdjkqOvuo";

export const Memory = {
  // 🧠 1. ท่อสร้างสรุป (Gemini 3.1 Flash Lite)
  // รับข้อมูลประวัติการคุยมาสรุปเป็นประโยคสั้นๆ 1 ประโยค
  generateDailySummary: async (historyData: string) => {
    if (!historyData || historyData.trim().length < 10) return null;
    try {
      // เรียกใช้ Gemini 3.1 Flash Lite (เร็ว แรง ประหยัด)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ text: `จงสรุปบทสนทนานี้เป็นประโยคสั้นๆ 1 ประโยค โดยดึงใจความสำคัญที่จิ๊กโก๋คุยออกมา (ห้ามใช้ประโยคซ้ำซาก): ${historyData}` }] 
            }],
            generationConfig: { maxOutputTokens: 100, temperature: 0.7, topP: 0.8 }
          })
        }
      );
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch (e) {
      console.error("❌ Gemini Error:", e);
      return null;
    }
  },

  // 💾 2. ท่อจัดเก็บความทรงจำ (บันทึกลง Supabase แบบ Manual Identity)
  // รับค่าชื่อเล่น (userId) ที่ดึงมาจาก localStorage ของเครื่องคนใช้งาน
  saveToArchive: async (
    userId: string, // 🚩 ชื่อเล่นที่เราตั้งไว้ (เช่น jiggo_legend)
    content: string, // ✅ ก้อนสรุปจาก Gemini
    effort: number, // ✅ ค่า Effort ที่ผู้ใช้ตั้ง
    postId: string, // ✅ ID ของ Artifact ตัวหลัก
    contentType: string = 'summary' // ✅ ประเภทสรุป
  ) => {
    // 🚩 กั้นห้อง: ถ้าไม่มีชื่อ User ก็ไม่ให้บันทึก (กันแอปพัง/ข้อมูลไม่มีเจ้าของ)
    if (!userId || !content || !postId) return { success: false };

    try {
      // ✅ สเต็ป 1: บันทึกก้อนสรุปลง Timeline (ตาราง post_updates)
      const { error: postUpdateError } = await supabase
        .from('post_updates')
        .insert({ 
          post_id: postId,
          user_id: userId, // 🚩 บันทึก "ชื่อเจ้าของ" สรุปก้อนนี้
          role: 'brother', 
          update_text: content,
          content_type: contentType, // 🚩 ประเภทสรุป (เช่น summary)
          created_at: new Date().toISOString()
        });

      if (postUpdateError) throw postUpdateError;

      // ✅ สเต็ป 2: อัปเดตค่า Effort คืนให้การ์ดหลัก (ตาราง artifacts)
      // เพิ่มความปลอดภัยด้วยการกรอง user_id เพื่ออัปเดตเฉพาะอันที่เป็นของเราจริง
      await supabase
        .from('artifacts')
        .update({ last_effort: effort })
        .eq('id', postId)
        .eq('user_id', userId); // 🚩 กรองเพื่อให้แน่ใจว่ามึงแก้ไขเฉพาะบันทึกที่เป็นของมึงเอง

      return { success: true };
    } catch (e) {
      console.error("❌ Archive System Error:", e);
      return { success: false, error: e };
    }
  }
};