import { MANAGER_PROMPT, JAVIS_PROMPT, BUFF_PROMPT } from './agentPrompts';
import { executeAgentActions } from './agentActions';

async function fetchGroq(messages, jsonMode = true) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY is missing');

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      response_format: jsonMode ? { type: "json_object" } : undefined,
      messages: messages,
      temperature: 0.1, // Manager needs to be deterministic
      max_tokens: 1000
    })
  });

  if (!response.ok) throw new Error('API Error from Groq');
  const data = await response.json();
  return data.choices[0].message.content;
}

export async function processAgentChat(userMessage, chatHistory, contextData, user) {
  // 1. Manager Router Phase
  let managerDecision;
  try {
    const routerResponse = await fetchGroq([
      { role: "system", content: MANAGER_PROMPT },
      { role: "user", content: userMessage }
    ]);
    managerDecision = JSON.parse(routerResponse);
  } catch (err) {
    console.error("Manager Router Error:", err);
    // Fallback to Javis
    managerDecision = { target_agent: "Javis" };
  }

  const targetAgent = managerDecision.target_agent === 'Buff' ? 'Buff' : 'Javis';
  
  // 2. Prepare Agent Prompt
  let systemPrompt = targetAgent === 'Buff' ? BUFF_PROMPT : JAVIS_PROMPT;
  
  if (targetAgent === 'Javis') {
    systemPrompt = systemPrompt
      .replace('{QUESTS}', JSON.stringify(contextData?.quests || []))
      .replace('{HABITS}', JSON.stringify(contextData?.habits || []))
      .replace('{TIMETABLE}', JSON.stringify(contextData?.timetable || null));
  } else {
    // Buff context
    systemPrompt = systemPrompt
      .replace('{PORTFOLIO}', JSON.stringify(contextData?.portfolio || []))
      .replace('{TRADES}', JSON.stringify(contextData?.trades || []));
  }

  // 3. Execute Target Agent
  const agentMessages = [
    { role: "system", content: systemPrompt },
    ...chatHistory,
    { role: "user", content: userMessage }
  ];

  let agentResponseText;
  try {
    agentResponseText = await fetchGroq(agentMessages, true);
  } catch (err) {
    console.error(`${targetAgent} Error:`, err);
    throw new Error(`${targetAgent} ไม่สามารถตอบกลับได้ในขณะนี้`);
  }

  const aiResponse = JSON.parse(agentResponseText);

  // 4. Execute Actions
  let actionResults = [];
  if (aiResponse.actions && aiResponse.actions.length > 0) {
    actionResults = await executeAgentActions(targetAgent, aiResponse.actions, user);
  }

  return {
    agentName: targetAgent,
    reply: aiResponse.reply,
    actionsExecuted: actionResults
  };
}
