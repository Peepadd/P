import React, { useState } from 'react';
import { supabase } from '../../supabase/supabaseClient'; 

const BatchSlipUploader = ({ onReview }) => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, statusText: '' });

  // ฟังก์ชันแปลงไฟล์รูปภาพเป็น Base64
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: files.length, statusText: 'กำลังเตรียมการ...' });

    const tempResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length, statusText: `AI กำลังวิเคราะห์รูปที่ ${i + 1}...` });
      
      try {
        const base64String = await fileToBase64(file);
        
        // เรียกใช้ Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('extract-slip', {
          body: { imageBase64: base64String }
        });

        if (error) throw error;
        if (!data || !data.amount) throw new Error('ไม่พบข้อมูลยอดเงิน');

        tempResults.push({ 
          fileName: file.name, 
          status: 'success', 
          data: data // ข้อมูล JSON จาก AI { amount, date, payee, category }
        });

      } catch (error) {
        console.error('AI OCR Error:', error);
        tempResults.push({ 
          fileName: file.name, 
          status: 'error', 
          message: 'อ่านข้อมูลไม่สำเร็จ (อาจไม่ใช่สลิป)' 
        });
      }
    }

    setResults(tempResults);
    setProcessing(false);
    setProgress({ current: 0, total: 0, statusText: '' });
    e.target.value = null; // ล้างค่า input
  };

  return (
    <div className="p-1 max-w-2xl mx-auto bg-white rounded-xl">
      <div className="mb-4">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="mb-1 text-sm text-indigo-600 font-semibold">
              คลิกเพื่อเลือก หรือลากรูปภาพสลิปมาวาง
            </p>
            <p className="text-xs text-indigo-500">ระบบ AI อ่านข้อมูลอัจฉริยะ (Gemini)</p>
          </div>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFilesChange} 
            disabled={processing}
            className="hidden"
          />
        </label>
      </div>

      {processing && (
        <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="text-indigo-600 font-medium flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {progress.statusText}
          </div>
          <p className="text-xs text-indigo-400 mt-1">รูปภาพที่ {progress.current} จาก {progress.total}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {results.map((res, index) => (
            <div key={index} className={`p-3 rounded-lg border ${res.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center gap-3">
                <span className="font-medium text-sm truncate flex-1 text-gray-700">{res.fileName}</span>
                {res.status === 'success' ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-green-700 text-sm whitespace-nowrap bg-green-100 px-2 py-1 rounded-md">
                      ✅ <span className="font-semibold">฿{res.data.amount.toLocaleString('th-TH')}</span>
                    </div>
                    {/* ปุ่มสำหรับกดเพื่อนำข้อมูลไปพรีฟิลลงฟอร์ม */}
                    <button 
                      onClick={() => onReview(res.data)}
                      className="text-xs bg-indigo-500 text-white px-2 py-1.5 rounded hover:bg-indigo-600 transition-colors font-medium"
                    >
                      ตรวจสอบ & บันทึก
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-600 text-sm whitespace-nowrap">
                    ❌ <span>{res.message}</span>
                  </div>
                )}
              </div>
              {/* แสดง Category และผู้รับเงินที่ AI เดามาให้ด้วยเพื่อความชัดเจน */}
              {res.status === 'success' && res.data.payee && (
                <div className="mt-1 text-xs text-gray-500 truncate">
                  โอนให้: {res.data.payee} • หมวดหมู่: {res.data.category || 'ไม่ระบุ'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchSlipUploader;
