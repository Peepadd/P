import React, { useState } from 'react';
import jsQR from 'jsqr';
import { supabase } from '../../supabase/supabaseClient';
import { Upload, XCircle, CheckCircle2, Loader2, ImagePlus } from 'lucide-react';

const BatchSlipUploader = ({ onComplete }) => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: files.length });

    const tempResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length });
      
      try {
        const payload = await extractQRFromFile(file);
        
        if (!payload) {
          tempResults.push({ fileName: file.name, status: 'error', message: 'ไม่พบ QR Code' });
          continue;
        }

        const verifiedData = await verifySlipMock(payload);
        await saveTransactionToDB(verifiedData);

        tempResults.push({ 
          fileName: file.name, 
          status: 'success', 
          data: verifiedData 
        });

      } catch (error) {
        tempResults.push({ 
          fileName: file.name, 
          status: 'error', 
          message: error.message || 'เกิดข้อผิดพลาด' 
        });
      }
    }

    setResults(tempResults);
    setProcessing(false);
    e.target.value = null; 

    // หากมีการส่ง callback มา ให้เรียกใช้เพื่อโหลดข้อมูลใหม่
    if (onComplete) {
      onComplete();
    }
  };

  const extractQRFromFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          resolve(code ? code.data : null);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Mock API Verification (สุ่มสำเร็จ/ล้มเหลว)
  const verifySlipMock = async (payload) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // จำลองการตรวจสอบ (โอกาสสำเร็จ 90%)
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
          // สุ่มยอดเงินและชื่อผู้รับ
          const randomAmount = Math.floor(Math.random() * 1000) + 100;
          const receivers = ['นาย A', 'บริษัท B', 'ร้านอาหาร C', 'ค่าไฟ', 'ค่าน้ำ'];
          const randomReceiver = receivers[Math.floor(Math.random() * receivers.length)];
          
          resolve({
            transRef: 'MOCK' + Date.now().toString().slice(-6),
            senderName: 'ผู้ใช้ ทดสอบ',
            receiverName: randomReceiver,
            amount: randomAmount,
            transDate: new Date().toISOString()
          });
        } else {
          reject(new Error('ข้อมูลสลิปไม่ถูกต้อง หรือหมดอายุ'));
        }
      }, 800); // จำลองการโหลด 800ms
    });
  };

  const saveTransactionToDB = async (data) => {
    const d = new Date(data.transDate);
    // แปลงเวลาให้เป็น local YYYY-MM-DD
    const localDateString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    const { error } = await supabase.from('transactions').insert([{
      id: crypto.randomUUID(),
      type: 'Expense',
      amount: parseFloat(data.amount),
      category: 'Slip Transfer', // หมวดหมู่ปริยาย
      note: 'โอนให้: ' + data.receiverName,
      date: localDateString,
      transaction_time: d.toISOString()
    }]);

    if (error) throw new Error(error.message);
  };

  return (
    <div className="p-1 max-w-2xl mx-auto bg-white">
      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-indigo-500" />
            <p className="mb-1 text-sm text-indigo-600 font-semibold">
              คลิกเพื่อเลือก หรือลากรูปภาพสลิปมาวาง
            </p>
            <p className="text-xs text-indigo-500">รองรับการเลือกหลายไฟล์พร้อมกัน</p>
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
        <div className="flex items-center justify-center gap-3 mb-6 text-indigo-600 font-medium p-4 bg-indigo-50 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>กำลังประมวลผล... ({progress.current} / {progress.total})</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {results.map((res, index) => (
            <div key={index} className={`p-3 rounded-lg border ${
              res.status === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex justify-between items-center gap-3">
                <span className="font-medium text-sm truncate flex-1 text-gray-700">
                  {res.fileName}
                </span>
                {res.status === 'success' ? (
                  <div className="flex items-center gap-1.5 text-green-700 text-sm whitespace-nowrap bg-green-100 px-2 py-1 rounded-md">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">฿{res.data.amount.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-600 text-sm whitespace-nowrap">
                    <XCircle className="w-4 h-4" />
                    <span>{res.message}</span>
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
