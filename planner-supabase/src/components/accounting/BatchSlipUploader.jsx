import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { supabase } from '../../supabase/supabaseClient'; 

const BatchSlipUploader = ({ onComplete }) => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, statusText: '' });

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: files.length, statusText: 'กำลังเตรียมการ...' });

    const tempResults = [];

    // ประมวลผลทีละรูป
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length, statusText: `กำลังสแกนรูปที่ ${i + 1}...` });
      
      try {
        // ใช้ OCR ดึงข้อมูลจากรูปภาพ
        const extractedData = await extractDataWithOCR(file);
        
        if (!extractedData.amount) {
          tempResults.push({ 
            fileName: file.name, 
            status: 'error', 
            message: 'อ่านยอดเงินไม่สำเร็จ (อาจเบลอหรือไม่ใช่สลิป)' 
          });
          continue;
        }

        // บันทึกลงฐานข้อมูล Supabase
        await saveTransactionToDB(extractedData);

        tempResults.push({ 
          fileName: file.name, 
          status: 'success', 
          data: extractedData 
        });

      } catch (error) {
        tempResults.push({ 
          fileName: file.name, 
          status: 'error', 
          message: 'เกิดข้อผิดพลาดในการสแกน' 
        });
      }
    }

    setResults(tempResults);
    setProcessing(false);
    setProgress({ current: 0, total: 0, statusText: '' });
    e.target.value = null; // ล้างค่า input

    if (onComplete) {
      onComplete();
    }
  };

  // --------------------------------------------------------
  // ฟังก์ชันหลัก: ทำ OCR สแกนรูปภาพและจับตัวเลข
  // --------------------------------------------------------
  const extractDataWithOCR = async (file) => {
    return new Promise(async (resolve, reject) => {
      try {
        const imageUrl = URL.createObjectURL(file);

        const result = await Tesseract.recognize(
          imageUrl,
          'tha+eng', 
          { 
            logger: m => {
              // console.log(`Progress: ${(m.progress * 100).toFixed(2)}%`);
            }
          }
        );

        const text = result.data.text;
        URL.revokeObjectURL(imageUrl); 
        
        console.log("ข้อความที่ AI อ่านได้:", text);

        // --- ใช้ Regex ดักจับตัวเลขยอดเงิน ---
        const amountRegex = /(?:จำนวนเงิน|Amount|ยอดเงิน|จำนวน)\s*[:\.]?\s*(?:THB|บาท)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{2})?)/i;
        const match = text.match(amountRegex);
        
        let amount = null;
        if (match && match[1]) {
           amount = parseFloat(match[1].replace(/,/g, ''));
        } else {
           // Fallback: ดึงตัวเลขที่ใหญ่ที่สุดที่มีทศนิยม 2 ตำแหน่ง
           const fallbackRegex = /([0-9]{1,3}(?:,[0-9]{3})*\.\d{2})/g;
           const matches = text.match(fallbackRegex);
           if (matches) {
               const numbers = matches.map(m => parseFloat(m.replace(/,/g, '')));
               amount = Math.max(...numbers);
           }
        }

        // มองหาชื่อผู้รับ (แบบคร่าวๆ)
        const nameRegex = /(?:นาย|นาง|น\.ส\.|Mr\.|Mrs\.|Ms\.)\s*([ก-๙a-zA-Z\s]+)/i;
        const nameMatch = text.match(nameRegex);
        const receiverName = nameMatch ? nameMatch[0].trim() : 'ไม่ระบุชื่อ';

        resolve({
          amount: amount,
          receiverName: receiverName,
          transDate: new Date().toISOString(),
          note: `โอนให้: ${receiverName} (OCR)`
        });

      } catch (err) {
        reject(err);
      }
    });
  };

  const saveTransactionToDB = async (data) => {
    const d = new Date(data.transDate);
    const localDateString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const localTimeString = d.toTimeString().split(' ')[0]; // HH:MM:SS

    const { error } = await supabase.from('transactions').insert([{
      id: crypto.randomUUID(),
      type: 'Expense',
      amount: parseFloat(data.amount),
      category: 'Slip Transfer',
      note: data.note,
      date: localDateString,
      transaction_time: localTimeString
    }]);

    if (error) throw new Error(error.message);
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
            <p className="text-xs text-indigo-500">ระบบ AI อ่านอักขระ (OCR)</p>
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
          <p className="text-xs text-indigo-400 mt-1">รูปภาพที่ {progress.current} จาก {progress.total} (ขั้นตอนนี้อาจใช้เวลา 5-10 วินาทีต่อรูป)</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {results.map((res, index) => (
            <div key={index} className={`p-3 rounded-lg border ${res.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center gap-3">
                <span className="font-medium text-sm truncate flex-1 text-gray-700">{res.fileName}</span>
                {res.status === 'success' ? (
                  <div className="flex items-center gap-1.5 text-green-700 text-sm whitespace-nowrap bg-green-100 px-2 py-1 rounded-md">
                    ✅ <span className="font-semibold">฿{res.data.amount.toLocaleString('th-TH')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-600 text-sm whitespace-nowrap">
                    ❌ <span>{res.message}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchSlipUploader;
