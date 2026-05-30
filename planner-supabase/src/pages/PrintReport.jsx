export default function PrintReport() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">พิมพ์รายงาน</h2>
        <p className="text-gray-500 mt-1">กรองข้อมูลและพิมพ์รายงานสรุปบัญชี</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">ตัวกรองข้อมูล</h3>
        <p className="text-gray-400 text-sm">กำลังเตรียมระบบ กรุณาตั้งค่า Supabase ก่อน</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">ตัวอย่างรายงาน</h3>
        </div>
        <div className="p-10 text-center text-gray-400">
          <p>เลือกช่วงวันที่และกดค้นหาเพื่อดูตัวอย่างรายงาน</p>
        </div>
      </div>
    </div>
  )
}
