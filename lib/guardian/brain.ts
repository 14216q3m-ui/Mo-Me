import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const Brain = {
  analyze: async ({ message, coreSummary, historyData, effort, mode, imageData }: any) => {
    // 🚩 [SECURITY UPDATE]: ดึง API Key จาก Environment Variable แทนการวางโต้งๆ
    // ถ้ามึงรันในเครื่อง ให้ใส่ใน .env.local 
    // ถ้ามึงเอาขึ้น Vercel ให้ไปตั้งค่าใน Dashboard ของมัน
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("❌ API Key Missing: ลืมตั้งค่ารหัสลับใน .env หรือเปล่าจิ๊กโก๋?");
      return { reply: "เครื่องพี่รวนว่ะ รหัสหาย", success: false };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    const tryGenerate = async (retries = 3): Promise<any> => {
      try {
        const effortLevel = Number(effort) || 5;

        let effortContext = "";
        if (effortLevel <= 3) {
          effortContext = "วันนี้น้องดูเหนื่อยหรือพยายามได้น้อย: ให้พี่ชายเน้นรับฟัง นิ่งสงบ ไม่กดดัน และให้กำลังใจแบบซัพพอร์ตความรู้สึกเป็นหลัก";
        } else if (effortLevel <= 7) {
          effortContext = "วันนี้น้องพยายามระดับปกติ: คุยแบบพี่น้องทั่วไป รับฟังและสะท้อนสิ่งที่น้องทำอย่างตรงไปตรงมา";
        } else {
          effortContext = "วันนี้น้องใส่เต็มที่และสู้สุดใจ: ให้พี่ชายแสดงความชื่นชมในพลังของน้อง ผลักดันและขยี้จุดที่น้องตั้งใจให้เห็นชัดเจน";
        }

        let systemPrompt = `
คุณคือ "พี่ชาย" ของจิ๊กโก๋ ในแอป Mo-Me บน MacBook มือสองเครื่องนี้
ทัศนคติหลัก:
1. มองข้ามปัจจุบันเพื่ออนาคต: จารึกความจริงวันนี้เพื่อเป็นพลังให้น้องในอีก 1 ปีข้างหน้า
2. เป็นพยานที่ซื่อสัตย์: ดึงเนื้อแท้ของความพยายาม (${effortLevel}/10) ออกมาให้มีน้ำหนัก
3. รักษา "สายใย": เชื่อมโยงทุกก้าวของน้องเข้ากับเป้าหมายใหญ่เสมอ
4. จริงใจและเรียล: คุยแบบพี่น้องบ้านๆ ห้วนบ้าง นิ่งบ้าง ตามเนื้อผ้า ไม่ต้องประดิษฐ์คำจนเกร็ง

แนวทางการเข้าหาน้องตามสภาวะวันนี้: ${effortContext}
บริบทตัวตนของน้อง: ${coreSummary}
`;

        if (mode === 'finalize') {
          systemPrompt += `
ภารกิจ: "จารึกเนื้อแท้ (The Raw Reflection)"
ให้สรุปเรื่องราววันนี้ในมุมมองของพี่ชายที่มองเห็น "เจตจำนงที่ซ่อนอยู่" ของน้อง:
1. [Stick to Facts]: ห้ามมโน ให้ใช้เนื้อหาจากประวัติการคุยล่าสุดเท่านั้น
2. [Spirit Decoding]: ไม่ต้องสรุปว่าน้องทำ "อะไร" แต่ให้สรุปว่า "สิ่งที่ทำมันสะท้อนความเท่ในตัวน้องออกมายังไง"
3. [The Weight of Effort]: ใช้ค่าพยายาม (${effortLevel}/10) เป็นตัวกำหนดน้ำหนักคำพูด
4. [No Filter]: ห้ามใช้คำว่า สรุป, พยายาม, เก่งมาก เขียนเหมือนพี่ชายรำพึงถึงความภูมิใจในตัวน้อง
5. [The Tone]: นิ่ง ดิบ ทรงพลัง ยาวประมาณ 3-4 ประโยคที่กระแทกใจที่สุด
`;
        } else {
          systemPrompt += `\nสไตล์การคุย: ตอบโต้ตามอารมณ์และสถานการณ์ แทนตัวเองว่าพี่ แทนผู้ใช้ว่าจิ๊กโก๋/มึง (ห้ามใช้คำว่า "แก") 
เน้นความเรียล: ตอบสั้นๆ กระชับ ห้ามประดิษฐ์คำเกินไป

🚩 การบอกลา: ใช้คำบอกลาห้วนๆ แบบพี่น้อง เช่น "เออ เจอกัน", "โชคดีมึง", "แยกย้าย"`;
        }

        const promptParts: any[] = [
          { text: systemPrompt },
          { text: `ประวัติการคุย: ${historyData}` },
          { text: `จิ๊กโก๋ส่งมาว่า: ${message}` }
        ];

        if (imageData?.base64) {
          const base64Data = imageData.base64.includes(",") ? imageData.base64.split(",")[1] : imageData.base64;
          const mimeType = imageData.mimeType || "image/jpeg";
          promptParts.push({ inlineData: { data: base64Data, mimeType } });
        }

        const result = await model.generateContent({
          contents: [{ role: "user", parts: promptParts }],
          generationConfig: { 
            maxOutputTokens: 1000, 
            temperature: mode === 'finalize' ? 0.8 : 0.85, 
            topP: 0.9,
            topK: 40
          }
        });

        const response = result.response;
        if (!response.candidates || response.candidates[0].finishReason === 'SAFETY') {
          return { reply: "พักผ่อนเหอะมึง", success: true };
        }

        const text = response.text().trim();
        return { reply: text, summary: text, success: true };

      } catch (e) {
        if (retries > 0) {
          await new Promise(res => setTimeout(res, 1000));
          return tryGenerate(retries - 1);
        }
        return { reply: "เครื่องพี่รวนว่ะ พักก่อนนะ", success: false };
      }
    };
    return await tryGenerate();
  }
};