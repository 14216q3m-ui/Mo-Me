import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const Chronicler = {
  inscribe: async (postId: string, message: string, analysis: any, imageUrl: string | null = null, effort: number = 0) => {
    const isVisible = typeof analysis?.is_visible === 'boolean' ? analysis.is_visible : true;
    const contentType = analysis?.content_type || 'chat';

    const { data, error } = await supabase.from("post_updates").insert([{ 
      post_id: postId, 
      update_text: message, 
      role: 'user',
      image_url: imageUrl, 
      is_visible: isVisible,
      content_type: contentType,
      effort: effort 
    }]).select();

    if (error) throw error;
    return data;
  },

  // 🟢 ปรับให้เลือกประเภทได้: chat (คุยเล่น) หรือ summary (จารึกลงการ์ด)
  recordBrother: async (postId: string, text: string, type: 'chat' | 'summary' = 'chat') => {
    const { data, error } = await supabase.from("post_updates").insert([{ 
      post_id: postId, 
      update_text: text, 
      role: 'brother', 
      is_visible: type === 'summary', // สรุปให้มองเห็นได้ในการ์ด
      content_type: type,
      effort: 0 
    }]);

    if (error) throw error;
    return data;
  },

  updateVault: async (vaultId: string | undefined, newSummary: string) => {
    // ... โค้ดส่วน Vault เหมือนเดิม
  }
};