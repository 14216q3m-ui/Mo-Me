import { createClient } from '@supabase/supabase-js';

// 🏛️ Mo-Me Oracle Connection
const supabaseUrl = 'https://wbvzkgjrpfjwinxbsckq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidnprZ2pycGZqd2lueGJzY2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODQwMzEsImV4cCI6MjA4NzI2MDAzMX0.bzntlf9eM8zIisPGPHUOSRdY73rTm7ZOeU2nogzoAm4'; 

// สร้าง Instance เดียวเพื่อใช้ทั้งแอป
export const supabase = createClient(supabaseUrl, supabaseKey);