from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx
import os
import json

app = FastAPI()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE = "https://api.deepseek.com/v1"

@app.post("/v1/messages")
async def messages(request: Request):
    body = await request.json()
    
    # แปลง Anthropic format → OpenAI/DeepSeek format
    openai_body = {
        "model": body.get("model", "deepseek-chat"),
        "messages": body.get("messages", []),
        "max_tokens": body.get("max_tokens", 4096),
        "temperature": body.get("temperature", 1.0),
        "stream": body.get("stream", False)
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{DEEPSEEK_BASE}/chat/completions",
                json=openai_body,
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=120.0
            )
            
            # แปลงกลับจาก OpenAI format → Anthropic format
            data = resp.json()
            
            if resp.status_code == 200 and "choices" in data:
                # OpenAI format: choices[0].message.content
                anthropic_response = {
                    "id": data.get("id", "msg-proxy"),
                    "type": "message",
                    "role": "assistant",
                    "content": [
                        {
                            "type": "text",
                            "text": data["choices"][0]["message"]["content"]
                        }
                    ],
                    "model": data.get("model", "deepseek-chat"),
                    "stop_reason": "end_turn",
                    "stop_sequence": None,
                    "usage": {
                        "input_tokens": data.get("usage", {}).get("prompt_tokens", 0),
                        "output_tokens": data.get("usage", {}).get("completion_tokens", 0)
                    }
                }
                return JSONResponse(content=anthropic_response, status_code=200)
            else:
                return JSONResponse(content=data, status_code=resp.status_code)
                
        except Exception as e:
            return JSONResponse(
                content={"error": str(e)},
                status_code=500
            )

@app.get("/v1/models")
async def models():
    return {
        "data": [
            {"id": "deepseek-chat", "object": "model"},
            {"id": "deepseek-reasoner", "object": "model"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8086)
