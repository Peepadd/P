# Claude Code + DeepSeek Proxy Setup Guide

## ขั้นตอนการตั้งค่า

### 1. ได้รับ DeepSeek API Key
1. ไปที่ https://platform.deepseek.com/
2. สมัครสมาชิกและเข้าสู่ระบบ
3. ไปที่ "API Keys" 
4. สร้าง API key ใหม่
5. คัดลอก API key (ขึ้นต้นด้วย `sk-`)

### 2. อัปเดต .env ไฟล์
แก้ไขไฟล์ `.env` ในไดเรกทอรี่นี้:
```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxx
```

### 3. รัน Proxy Server
```powershell
cd "C:\Users\peera\OneDrive\Desktop\Project\โฟลเดอร์ใหม่\P\claude-code-proxy"
python proxy.py
```

เซิร์ฟเวอร์จะเริ่มที่ `http://localhost:8086`

### 4. ในเทอร์มินัลใหม่ ตั้งค่า Environment Variables
```powershell
$env:ANTHROPIC_BASE_URL="http://localhost:8086"
$env:ANTHROPIC_AUTH_TOKEN="dummy"
```

### 5. ติดตั้ง Claude Code (ถ้ายังไม่ได้ติดตั้ง)
```powershell
npm install -g "@anthropic-ai/claude-code"
```

### 6. รัน Claude Code
```powershell
claude
```

---

## โมเดล DeepSeek ที่สนับสนุน

- `deepseek-chat` - โมเดลทั่วไป (แนะนำ)
- `deepseek-reasoner` - โมเดลสำหรับการให้เหตุผลเชิงซ้อน

---

## Troubleshooting

### Port 8086 ถูกใช้งานแล้ว
แก้ไข `proxy.py` บรรทัด 55:
```python
uvicorn.run(app, host="0.0.0.0", port=8087)  # เปลี่ยนเป็น port อื่น
```

### DeepSeek API Key ไม่ถูกต้อง
ตรวจสอบ:
1. API key ขึ้นต้นด้วย `sk-`
2. ไม่มี whitespace ที่ต้นหรือท้าย
3. Key ยังไม่หมดอายุ

### Claude Code ไม่พบ
ติดตั้งใหม่:
```powershell
npm install -g "@anthropic-ai/claude-code" --force
```

---

## Advanced: Persistent Environment Setup

สร้างไฟล์ `claude-setup.ps1`:
```powershell
$env:ANTHROPIC_BASE_URL="http://localhost:8086"
$env:ANTHROPIC_AUTH_TOKEN="dummy"
$env:DEEPSEEK_API_KEY=$(Get-Content .env | Select-String "DEEPSEEK_API_KEY" | ForEach-Object {$_ -replace '^DEEPSEEK_API_KEY='})
claude $args
```

จากนั้นใช้:
```powershell
.\claude-setup.ps1
```

---

## ข้อควรระวัง

⚠️ **ข้อจำกัด:**
- อาจไม่รองรับ tool use (file edit, bash) แบบเต็มรูปแบบ
- ประสิทธิภาพขึ้นกับ DeepSeek server
- ความล่าช้าอาจสูงกว่า Anthropic API

✅ **ข้อดี:**
- ราคาถูกกว่ามาก
- เหมาะสำหรับการทดลอง
- DeepSeek-V3 มีความสามารถสูง

---

## ติดต่อสนับสนุน

หากมีปัญหา:
1. ตรวจสอบเอกสาร: https://platform.deepseek.com/api-docs
2. ตรวจสอบ proxy logs
3. ตรวจสอบ network connectivity
