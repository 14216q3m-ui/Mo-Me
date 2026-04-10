"use client"; // เพิ่มไว้ถ้ามีการใช้ Context หรือ State ในอนาคต แต่ถ้าไม่มีก็เอาออกได้ครับ
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${inter.variable} ${playfair.variable} bg-black antialiased`}>
        
        {/* ❌ เอา <Navbar /> ออกแล้ว เพื่อไปใส่ในไฟล์แม่ (page.tsx) ของแต่ละหน้าแทน */}
        
        <main className="min-h-screen">
          {/* ❌ เอา pt-20 ออก เพื่อให้แต่ละหน้ากำหนดระยะห่าง (Padding) ของตัวเองได้อิสระ */}
          {children}
        </main>

      </body>
    </html>
  );
}