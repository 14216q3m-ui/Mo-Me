"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  isEditing?: boolean;
  onBack?: () => void;
}

export default function Navbar({ isEditing, onBack }: NavbarProps) {
  const pathname = usePathname();

  // ปิด Navbar เฉพาะหน้า Inscribe
  if (pathname === "/inscribe") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.nav 
        key={isEditing ? "editing" : "standard"}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 w-full z-[1000] px-8 py-4 transition-all duration-500 ${
          isEditing 
            ? "bg-transparent pointer-events-none" 
            : "bg-black/60 backdrop-blur-xl border-b border-white/[0.03]"
        }`}
      >
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto pointer-events-auto">
          {/* --- ฝั่งซ้าย: Logo (หายไปตอน Editing) --- */}
          <div className="flex-1">
            {!isEditing && (
              <Link href="/">
                <h1 className="text-xl font-black tracking-tighter text-[#FFFF00] hover:scale-105 transition-all w-fit">
                  Mo-Me
                </h1>
              </Link>
            )}
          </div>

          {/* --- ฝั่งขวา: Menu (หายไปตอน Editing เพื่อหลบให้ปุ่ม X ของ Editor) --- */}
          {!isEditing && (
            <div className="flex items-center gap-8 md:gap-12">
              <Link 
                href="/" 
                className={`text-[9px] font-bold tracking-[0.3em] transition-all hover:text-white ${
                  pathname === "/" ? "text-[#FFFF00]" : "text-white/40"
                }`}
              >
                EXHIBITION
              </Link>
              <Link 
                href="/archive" 
                className={`text-[9px] font-bold tracking-[0.3em] transition-all hover:text-white ${
                  pathname === "/archive" ? "text-[#FFFF00]" : "text-white/40"
                }`}
              >
                ARCHIVE
              </Link>
              <Link 
                href="/inscribe"
                className="bg-[#FFFF00] text-black px-5 py-2 rounded-full text-[9px] font-black hover:shadow-[0_0_20px_rgba(255,255,0,0.4)] transition-all active:scale-95"
              >
                + INSCRIBE
              </Link>
            </div>
          )}
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}