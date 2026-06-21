import { useState } from 'react';
import { BrainCircuit, GraduationCap, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function AgentHub() {
  const [activeTab, setActiveTab] = useState('manager');

  const agents = [
    {
      id: 'manager',
      name: 'Manager',
      role: 'Chief Router',
      icon: <BrainCircuit size={32} className="text-accent" />,
      description: 'รับคำสั่งจากฮันเตอร์และส่งต่อให้ผู้ช่วยที่เหมาะสม',
      color: 'bg-accent-soft border-accent'
    },
    {
      id: 'javis',
      name: 'Javis',
      role: 'Life & Academic',
      icon: <GraduationCap size={32} className="text-blue-500" />,
      description: 'ดูแลตารางเรียน, การบ้าน, จัดการเวลา และความโปรดักทีฟ',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'buff',
      name: 'Buff',
      role: 'Wealth & Investment',
      icon: <TrendingUp size={32} className="text-emerald-500" />,
      description: 'ดูแลรายรับ-รายจ่าย, หุ้น/ETF และเป้าหมายทางการเงิน',
      color: 'bg-emerald-50 border-emerald-200'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Sparkles className="text-accent" />
          Agent Hub
        </h1>
        <p className="text-sm text-muted mt-1">
          ศูนย์บัญชาการระบบ Multi-Agent สำหรับ Life_OS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`cursor-pointer transition-all hover:shadow-card-hover ${activeTab === agent.id ? `ring-2 ring-accent ${agent.color}` : ''}`}
            onClick={() => setActiveTab(agent.id)}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="bg-surface p-3 rounded-md shadow-card border border-gray-100">
                {agent.icon}
              </div>
              <div>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <CardDescription className="text-xs">{agent.role}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">{agent.description}</p>

              {agent.id === 'javis' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Timetables</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Checklists</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Pomodoro</span>
                </div>
              )}
              {agent.id === 'buff' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Stocks</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Accounting</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Rider Income</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-dashed border-2 bg-surface-warm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center shadow-card mb-4">
            <BrainCircuit size={28} className="text-accent" />
          </div>
          <h3 className="font-semibold text-gray-900 text-lg mb-2">วิธีใช้งาน Agent</h3>
          <p className="text-muted text-sm max-w-md">
            คลิกที่ปุ่ม <Sparkles size={14} className="inline text-accent mx-1" /> ด้านขวาล่างของหน้าจอ
            เพื่อเปิด OmniAssistant จากนั้นพิมพ์สั่งงานด้วยภาษาปกติได้เลย Manager จะคอยแยกย้ายงานให้เอง
          </p>
          <div className="mt-6 flex flex-col gap-2 w-full max-w-sm text-left">
            <div className="bg-surface p-3 rounded-lg border shadow-card text-sm text-muted">
              <span className="font-medium text-gray-900 block mb-1">ลองพิมพ์ว่า:</span>
              "เช็คราคาหุ้น VOO ให้หน่อย"
            </div>
            <div className="bg-surface p-3 rounded-lg border shadow-card text-sm text-muted">
              <span className="font-medium text-gray-900 block mb-1">ลองพิมพ์ว่า:</span>
              "เพิ่มงาน อ่านหนังสือรังสีวิทยา หน่อย"
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
