import React, { useState, useEffect } from 'react';
import liff from '@line/liff';
import { supabase } from '../../supabase/supabaseClient';

export default function LineLinkProfile() {
  const [loading, setLoading] = useState(true);
  const [lineProfile, setLineProfile] = useState(null);
  const [error, setError] = useState('');
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
        
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineProfile(profile);
          await handleLinkAccount(profile.userId);
        }
      } catch (err) {
        console.error('LIFF initialization failed', err);
        setError('ไม่สามารถโหลด LINE LIFF ได้ในขณะนี้');
      } finally {
        setLoading(false);
      }
    };
    initLiff();
  }, []);

  const handleLinkAccount = async (lineUserId) => {
    try {
      // 1. ดึงข้อมูล User ปัจจุบันของ Supabase (Auth)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ');
      }

      // 2. บันทึก / อัปเดตข้อมูล (Upsert) ลงในตาราง user_profiles
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id, // UUID ของ Supabase Auth
          email: user.email,
          line_user_id: lineUserId // TEXT UNIQUE ที่ได้จาก LIFF
        }, { onConflict: 'id' });

      if (upsertError) throw upsertError;
      
      setLinked(true);
    } catch (err) {
      console.error('Account linking error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการผูกบัญชี');
    }
  };

  const handleLineLogin = () => {
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#06C755] mr-3"></div>
        <span className="text-gray-600 font-medium">กำลังเตรียมระบบเชื่อมต่อ...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#06C755]/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-[#06C755]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.301.039.771.018 1.05l-.169 1.026c-.053.303-.242 1.481 1.298.835 1.539-.646 8.309-4.896 10.518-7.732 1.055-1.391 1.242-2.844 1.242-5.379z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">การเชื่อมต่อ LINE</h2>
          <p className="text-sm text-gray-500">เพื่อรับการแจ้งเตือนและบันทึกบัญชี</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      {linked && lineProfile ? (
        <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={lineProfile.pictureUrl} 
              alt="Profile" 
              className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
            />
            <div>
              <p className="text-sm font-semibold text-green-800">เชื่อมต่อสำเร็จแล้ว</p>
              <p className="text-sm text-green-600">{lineProfile.displayName}</p>
            </div>
          </div>
          <span className="text-2xl">✅</span>
        </div>
      ) : (
        <button
          onClick={handleLineLogin}
          className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#06C755] hover:bg-[#05b34c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#06C755] transition-all active:scale-95"
        >
          เชื่อมต่อบัญชี LINE ตอนนี้
        </button>
      )}
    </div>
  );
}
