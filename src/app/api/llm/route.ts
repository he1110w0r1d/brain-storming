import { NextRequest, NextResponse } from 'next/server';
import { LLMCallParams, LLMResponse } from '@/lib/brainstorm/types';

const API_BASE = process.env.LLM_API_BASE || 'https://ark.cn-beijing.volces.com/api/coding/v3';
const API_KEY = process.env.LLM_API_KEY || '';
const SERVER_DEFAULT_MODEL = process.env.DEFAULT_MODEL;

export async function POST(req: NextRequest) {
  try {
    const params: LLMCallParams = await req.json();
    let { model, systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2000 } = params;

    // 关键修复：如果后端配置了 DEFAULT_MODEL，则强制覆盖前端传来的模型名称（除非前端传来的不是默认值）
    if (SERVER_DEFAULT_MODEL && (model === 'doubao-pro-32k' || !model)) {
      model = SERVER_DEFAULT_MODEL;
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'LLM_API_KEY is not configured on the server' }, { status: 500 });
    }

    const endpoint = `${API_BASE}/chat/completions`;
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `API Error: ${response.status} - ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Normalize response
    const typedData = data as any;
    const content = typedData.choices?.[0]?.message?.content || '';
    
    const result: LLMResponse = {
      content,
      model,
      usage: typedData.usage ? {
        promptTokens: typedData.usage.prompt_tokens || 0,
        completionTokens: typedData.usage.completion_tokens || 0,
        totalTokens: typedData.usage.total_tokens || 0,
      } : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('LLM API Route Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
