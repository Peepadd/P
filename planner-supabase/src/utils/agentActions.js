import { supabase } from '../supabase/supabaseClient';
import { getSingleStockQuote } from './stockApi';
import { askNotebookLM } from '../../.agents/skills/notebooklm_bridge';

export async function executeAgentActions(agentName, actions, user) {
  if (!actions || actions.length === 0) return [];
  const results = [];

  for (const action of actions) {
    try {
      if (agentName === 'Javis') {
        if (action.type === 'add_quest') {
          const { error } = await supabase.from('academic_items').insert({
            title: action.payload.title,
            subject: action.payload.subject || 'อื่นๆ',
            type: 'งาน/การบ้าน',
            status: 'ยังไม่เริ่ม',
            created_at: new Date().toISOString()
          });
          if (error) throw error;
          results.push(`✅ เพิ่มเควสต์: ${action.payload.title}`);
        } 
        else if (action.type === 'add_habit') {
          const { error } = await supabase.from('habits').insert({
            name: action.payload.name,
            color: action.payload.color || '#6366f1',
            created_at: new Date().toISOString()
          });
          if (error) throw error;
          results.push(`✅ เพิ่มนิสัย: ${action.payload.name}`);
        }
        else if (action.type === 'ask_notebook') {
          const nbResult = await askNotebookLM(action.payload.query, action.payload.notebookId);
          if (nbResult.success) {
            results.push(`📚 NotebookLM: ${nbResult.text}`);
          } else {
            results.push(`❌ NotebookLM Error: ${nbResult.error}`);
          }
        }
      } 
      else if (agentName === 'Buff') {
        if (action.type === 'check_stock_price') {
          const quote = await getSingleStockQuote(action.payload.symbol);
          if (quote && quote.price !== null) {
             results.push(`📈 ราคา ${quote.symbol}: ${quote.price.toFixed(2)} ${quote.currency} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`);
          } else {
             results.push(`❌ ไม่พบข้อมูลราคาของ ${action.payload.symbol}`);
          }
        }
        else if (action.type === 'add_income' || action.type === 'add_expense') {
          const isIncome = action.type === 'add_income';
          const { error } = await supabase.from('transactions').insert({
            user_id: user.id,
            amount: action.payload.amount,
            type: isIncome ? 'INCOME' : 'EXPENSE',
            category: action.payload.note || (isIncome ? 'รายรับ' : 'รายจ่าย'),
            note: action.payload.note,
            date: new Date().toISOString()
          });
          if (error) throw error;
          results.push(`💰 บันทึก${isIncome ? 'รายรับ' : 'รายจ่าย'}: ${action.payload.amount} บาท`);
        }
      }
    } catch (err) {
      results.push(`❌ การกระทำล้มเหลว (${action.type}): ${err.message}`);
    }
  }
  
  return results;
}
