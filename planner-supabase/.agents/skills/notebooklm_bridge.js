// .agents/skills/notebooklm_bridge.js
import { NotebookLM } from 'notebooklm';

/**
 * --------------------------------------------------------------------------
 * NotebookLM Bridge (Unofficial API Integration)
 * --------------------------------------------------------------------------
 * คำเตือน: สคริปต์นี้เป็นสะพานเชื่อมต่อกับระบบ Google NotebookLM
 * เนื่องจากเป็น Unofficial API คุณจำเป็นต้องใส่ Session Cookie (__Secure-1PSID)
 * ของคุณเองใน Environment Variables
 * 
 * VITE_NOTEBOOKLM_SESSION_ID=your_cookie_here
 * VITE_NOTEBOOKLM_DEFAULT_NOTEBOOK_ID=your_notebook_id_here
 */

export async function askNotebookLM(query, notebookId = null) {
  try {
    const sessionId = import.meta.env.VITE_NOTEBOOKLM_SESSION_ID;
    const targetNotebookId = notebookId || import.meta.env.VITE_NOTEBOOKLM_DEFAULT_NOTEBOOK_ID;

    if (!sessionId) {
      throw new Error("ยังไม่ได้ตั้งค่า VITE_NOTEBOOKLM_SESSION_ID ในไฟล์ .env");
    }

    if (!targetNotebookId) {
      throw new Error("ยังไม่ได้ระบุ Notebook ID ที่ต้องการถาม");
    }

    // สร้าง Client
    const client = new NotebookLM({
      sessionId: sessionId
    });

    // ส่งคำถาม
    console.log(`[NotebookLM] กำลังถามคำถาม: "${query}" ไปยัง Notebook ID: ${targetNotebookId}`);
    const response = await client.chat(targetNotebookId, query);
    
    return {
      success: true,
      text: response.text || response,
      sources: response.citations || []
    };
  } catch (error) {
    console.error("[NotebookLM Bridge Error]:", error);
    return {
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ NotebookLM"
    };
  }
}
