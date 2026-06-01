import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../context/AuthContext'; // อิงจากโปรเจกต์คุณที่มี AuthContext

// กติกาแจก EXP
const EXP_RATES = {
  checklist: 15,
  habit: 10,
  habit_bonus: 50,
  pomodoro_per_min: 2
};

// ฟังก์ชันคำนวณ Rank
const getRank = (level) => {
  if (level >= 50) return 'S-Rank';
  if (level >= 41) return 'A-Rank';
  if (level >= 31) return 'B-Rank';
  if (level >= 21) return 'C-Rank';
  if (level >= 11) return 'D-Rank';
  return 'E-Rank';
};

export function useLeveling() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูล Hunter Stats ของ User
  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('hunter_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // ถ้ายังไม่มีข้อมูล (User ใหม่) ให้สร้าง Profile เลเวล 1 E-Rank
        const initialStats = {
          user_id: user.id,
          level: 1,
          current_exp: 0,
          total_exp: 0,
          rank: 'E-Rank'
        };
        const { data: newData, error: insertError } = await supabase
          .from('hunter_stats')
          .insert([initialStats])
          .select()
          .single();
          
        if (!insertError) setStats(newData);
      } else if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching hunter stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ฟังก์ชันหลักสำหรับเพิ่ม EXP
  const gainExp = async (sourceType, sourceId = null, durationMinutes = 0) => {
    if (!user || !stats) return null;

    // 1. คำนวณ EXP ที่ได้รับ
    let expGained = 0;
    let description = '';

    switch (sourceType) {
      case 'checklist':
        expGained = EXP_RATES.checklist;
        description = 'เคลียร์ภารกิจรายวัน';
        break;
      case 'habit':
        expGained = EXP_RATES.habit;
        description = 'รักษาวินัย (Habit)';
        break;
      case 'habit_bonus':
        expGained = EXP_RATES.habit_bonus;
        description = 'โบนัสรักษาวินัยต่อเนื่อง 7 วัน!';
        break;
      case 'pomodoro':
        expGained = durationMinutes * EXP_RATES.pomodoro_per_min;
        description = `ฝึกสมาธิ (Pomodoro) ${durationMinutes} นาที`;
        break;
      default:
        expGained = 0;
    }

    if (expGained === 0) return null;

    // 2. คำนวณ Level Up!
    let { level, current_exp, total_exp, rank } = stats;
    let leveledUp = false;
    let oldLevel = level;

    current_exp += expGained;
    total_exp += expGained;

    // ลูปเช็คเผื่อได้ EXP เยอะจนอัปทีเดียวหลายเลเวล
    while (current_exp >= level * 100) {
      current_exp -= level * 100; // หัก EXP ตามหลอดของเลเวลนั้นๆ
      level += 1;
      leveledUp = true;
    }

    const newRank = getRank(level);
    const rankUp = rank !== newRank;

    // 3. บันทึกลง Supabase (ทำพร้อมกันทั้ง 2 ตารางเพื่อความรวดเร็ว)
    try {
      const updateStats = supabase
        .from('hunter_stats')
        .update({
          level,
          current_exp,
          total_exp,
          rank: newRank,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      const insertLog = supabase
        .from('exp_logs')
        .insert([{
          user_id: user.id,
          source_type: sourceType,
          source_id: sourceId,
          exp_gained: expGained,
          description: description
        }]);

      await Promise.all([updateStats, insertLog]);
      
      // อัปเดต State ใน React ทันทีเพื่อให้ UI เปลี่ยนแปลงแบบ Real-time
      setStats({ ...stats, level, current_exp, total_exp, rank: newRank });

      // คืนค่ากลับไปให้ Component เรียกใช้เผื่อทำ Effect พลุแตกหรือ Popup
      return { 
        expGained, 
        leveledUp, 
        rankUp,
        oldLevel, 
        newLevel: level, 
        newRank 
      };

    } catch (err) {
      console.error('Failed to gain EXP:', err);
      return null;
    }
  };

  return { stats, loading, gainExp, refreshStats: fetchStats };
}
