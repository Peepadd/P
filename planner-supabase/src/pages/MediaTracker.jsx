import React, { useState } from 'react';
import { useMediaTracker } from '../hooks/useMediaTracker';
import { Play, BookOpen, Film, Plus, Minus, Trash2, PlusCircle, X } from 'lucide-react';

export default function MediaTracker() {
  const { mediaList, loading, addMedia, updateProgress, deleteMedia } = useMediaTracker();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', media_type: 'Anime', status: 'In Progress', progress: 0, total_length: '' });

  const getMediaIcon = (type) => {
    switch (type) {
      case 'Anime': return <Play size={18} className="text-rose-500" />;
      case 'Manga': return <BookOpen size={18} className="text-blue-500" />;
      case 'Movie': return <Film size={18} className="text-emerald-500" />;
      default: return <BookOpen size={18} className="text-gray-500" />;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addMedia({
      ...formData,
      total_length: formData.total_length ? parseInt(formData.total_length) : null,
      progress: parseInt(formData.progress)
    });
    if (success) {
      setShowModal(false);
      setFormData({ title: '', media_type: 'Anime', status: 'In Progress', progress: 0, total_length: '' });
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">กำลังโหลดคลังแสง...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Media & Hobby Tracker</h1>
          <p className="text-slate-500 text-sm">ติดตามความคืบหน้าอนิเมะและมังงะเรื่องโปรด</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <PlusCircle size={18} />
          <span>เพิ่มรายการ</span>
        </button>
      </div>

      {mediaList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500">ยังไม่มีรายการใน Watchlist/Readlist</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaList.map((media) => (
            <div key={media.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-50 rounded-lg">{getMediaIcon(media.media_type)}</div>
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1" title={media.title}>{media.title}</h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {media.media_type} • {media.status}
                    </span>
                  </div>
                </div>
                <button onClick={() => deleteMedia(media.id)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-mono font-medium text-indigo-600">
                    {media.progress} {media.total_length ? `/ ${media.total_length}` : ''}
                  </span>
                </div>
                
                {/* Progress Bar & Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: media.total_length ? `${Math.min((media.progress / media.total_length) * 100, 100)}%` : '100%' }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-200">
                    <button 
                      onClick={() => updateProgress(media.id, Math.max(0, media.progress - 1), media.progress)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded-md transition"
                    ><Minus size={16} /></button>
                    <button 
                      onClick={() => updateProgress(media.id, media.progress + 1, media.progress)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded-md transition"
                    ><Plus size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal เพิ่มรายการใหม่ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">เพิ่มรายการใหม่</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อเรื่อง</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="เช่น Solo Leveling, One Piece, Black Clover..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ประเภท</label>
                  <select value={formData.media_type} onChange={e => setFormData({...formData, media_type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="Anime">Anime</option>
                    <option value="Manga">Manga</option>
                    <option value="Light Novel">Light Novel</option>
                    <option value="Movie">Movie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">สถานะ</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="In Progress">กำลังติดตาม</option>
                    <option value="Plan to Watch">แพลนไว้</option>
                    <option value="Completed">จบแล้ว</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ความคืบหน้า (ตอนปัจจุบัน)</label>
                  <input type="number" min="0" value={formData.progress} onChange={e => setFormData({...formData, progress: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนตอนทั้งหมด (ถ้ามี)</label>
                  <input type="number" min="1" value={formData.total_length} onChange={e => setFormData({...formData, total_length: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none" placeholder="ไม่ระบุได้" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm">บันทึกรายการ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
