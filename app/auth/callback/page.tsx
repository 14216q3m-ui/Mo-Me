"use client";
import { useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ForgeCard from "@/components/ForgeCard";

// สร้าง Component หลักแยกออกมา
function AuthCallbackContent() {
  const router = useRouter();

  useEffect(() => {
    const processAuth = async () => {
      try {
        // ดึง Session เพื่อยืนยันว่า Token จากเมลใช้ได้จริง
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (data?.session) {
          // ถ้ามี Session แล้ว ให้ดีเลย์นิดนึงเพื่อให้แน่ใจว่า Browser เก็บ Cookie ทัน
          setTimeout(() => {
            router.push("/");
            router.refresh(); // บังคับรีเฟรชหน้าหลักเพื่อดึงข้อมูลใหม่
          }, 500);
        } else {
          // ถ้าไม่มี session ให้กลับไป login
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth Callback Error:", err);
        router.push("/login?error=auth_failed");
      }
    };

    processAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
      <div className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] animate-pulse">
        Finalizing Your Entry...
      </div>
    </div>
  );
}

// ครอบด้วย Suspense เพื่อป้องกัน Error เวลาทำ Client-side Rendering
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}