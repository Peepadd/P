import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLeveling } from './useLeveling';

export function useMediaTracker() {
  const { user } = useAuth();
  const { gainExp } = useLeveling();
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('media_tracker')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMediaList(data);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const addMedia = async (mediaData) => {
    try {
      const { error } = await supabase.from('media_tracker').insert([{ ...mediaData, user_id: user.id }]);
      if (error) throw error;
      await fetchMedia();
      return true;
    } catch (error) {
      console.error('Error adding media:', error);
      return false;
    }
  };

  const updateProgress = async (id, newProgress, currentProgress) => {
    try {
      const { error } = await supabase
        .from('media_tracker')
        .update({ 
          progress: newProgress,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // อัปเดต UI ทันทีโดยไม่ต้องโหลดใหม่
      setMediaList(prev => prev.map(m => m.id === id ? { ...m, progress: newProgress } : m));

      // ผสานระบบ Leveling! ได้รับ EXP นิดหน่อยเมื่ออ่าน/ดูจบ 1 ตอน (ใช้โควตาของ habit)
      if (newProgress > currentProgress) {
        const result = await gainExp('habit', id);
        if (result?.leveledUp) {
          alert(`🎉 LEVEL UP! ดูเพลินจนเลื่อนเป็น Level ${result.newLevel} [${result.newRank}]`);
        }
      }
      return true;
    } catch (error) {
      console.error('Error updating progress:', error);
      return false;
    }
  };

  const deleteMedia = async (id) => {
    try {
      const { error } = await supabase.from('media_tracker').delete().eq('id', id);
      if (error) throw error;
      setMediaList(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting media:', error);
      return false;
    }
  };

  return { mediaList, loading, addMedia, updateProgress, deleteMedia, refreshMedia: fetchMedia };
}
