import { supabase } from '../supabase/supabaseClient';

/**
 * ฟังก์ชันเรียก Edge Function `stock-quote` เพื่อดึงราคาหุ้น
 * (ช่วยแก้ปัญหา CORS ที่อาจเกิดจากการเรียก Yahoo Finance ตรงจาก Browser)
 */
export async function getStockQuotes(symbols) {
  if (!symbols || symbols.length === 0) return [];
  
  // แปลงให้เป็น string คั่นด้วยลูกน้ำ
  const symbolsQuery = Array.isArray(symbols) ? symbols.join(',') : symbols;

  try {
    const { data, error } = await supabase.functions.invoke('stock-quote', {
      body: { symbols: symbolsQuery }
    });

    if (error) throw error;
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch stock quotes:', error);
    // Fallback: ถ้าเรียก Edge function ไม่สำเร็จ (อาจจะยังไม่ได้ deploy) ลองใช้ API ทดแทน
    return [];
  }
}

export async function getSingleStockQuote(symbol) {
  const quotes = await getStockQuotes([symbol]);
  if (quotes && quotes.length > 0) {
    return quotes[0];
  }
  return null;
}
