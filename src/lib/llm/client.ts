import { LLMCallParams, LLMResponse } from '@/lib/brainstorm/types';

const IS_SERVER = typeof window === 'undefined';
const API_BASE = process.env.LLM_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3';
const API_KEY = process.env.LLM_API_KEY || '';

const TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;

interface StreamCallback {
  onChunk?: (content: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

async function callWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

export async function callModel(
  params: LLMCallParams,
  callback?: StreamCallback
): Promise<LLMResponse> {
  const { model, systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2000 } = params;

  // 如果是在浏览器端运行，则通过我们自己的 API Route 代理，以保护 API Key
  if (!IS_SERVER) {
    try {
      const response = await callWithTimeout(
        fetch('/api/llm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }),
        TIMEOUT_MS
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Proxy API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Call via proxy failed:', error);
      throw error;
    }
  }

  // 以下是服务器端执行的逻辑
  const endpoint = `${API_BASE}/chat/completions`;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await callWithTimeout(
        fetch(endpoint, {
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
            stream: callback ? true : false,
          }),
        }),
        TIMEOUT_MS
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      if (callback && response.body) {
        return await handleStreamResponse(response.body, model, callback);
      }

      const data = await response.json();
      return normalizeModelResponse(data, model);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (callback?.onError && attempt === MAX_RETRIES) {
        callback.onError(lastError);
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to call model after retries');
}

async function handleStreamResponse(
  body: ReadableStream<Uint8Array>,
  model: string,
  callback: StreamCallback
): Promise<LLMResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let content = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            callback.onComplete?.();
            return { content, model };
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;

            if (delta) {
              content += delta;
              callback.onChunk?.(delta);
            }
          } catch {
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  callback.onComplete?.();
  return { content, model };
}

function normalizeModelResponse(data: unknown, model: string): LLMResponse {
  const typedData = data as {
    choices?: Array<{
      message?: { content?: string };
      delta?: { content?: string };
    }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  const content = typedData.choices?.[0]?.message?.content || '';

  return {
    content,
    model,
    usage: typedData.usage ? {
      promptTokens: typedData.usage.prompt_tokens || 0,
      completionTokens: typedData.usage.completion_tokens || 0,
      totalTokens: typedData.usage.total_tokens || 0,
    } : undefined,
  };
}

export function createMockLLMResponse(content: string, model: string): LLMResponse {
  return {
    content,
    model,
    usage: {
      promptTokens: 100,
      completionTokens: Math.floor(content.length / 4),
      totalTokens: 100 + Math.floor(content.length / 4),
    },
  };
}

export async function mockCallModel(
  params: LLMCallParams
): Promise<LLMResponse> {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  const searchText = (params.systemPrompt + ' ' + params.userPrompt).toLowerCase();
  
  // 识别角色
  let roleId = 'product-manager';
  if (searchText.includes('架构师') || searchText.includes('architect')) roleId = 'tech-architect';
  else if (searchText.includes('增长') || searchText.includes('growth')) roleId = 'growth-strategist';
  else if (searchText.includes('设计') || searchText.includes('ux')) roleId = 'ux-designer';
  else if (searchText.includes('质疑') || searchText.includes('skeptic')) roleId = 'skeptic';

  // 识别轮次
  let round = 1;
  if (searchText.includes('总结') || searchText.includes('summary')) round = 4;
  else if (searchText.includes('第三轮') || searchText.includes('final position')) round = 3;
  else if (searchText.includes('第二轮') || searchText.includes('round 2')) round = 2;

  const responses: Record<string, Record<number, string>> = {
    'product-manager': {
      1: '从产品视角看，我们需要关注核心用户价值。建议首个版本聚焦于解决用户的痛点，快速上线 MVP 并收集反馈。',
      2: '我同意架构师关于扩展性的看法，但我们要平衡开发进度。对于设计提出的交互方案，我认为可以再简化一些。',
      3: '综合各方意见，我的最终判断是：优先保证核心功能体验，技术上采用稳健方案，分阶段实施增长策略。',
      4: '【产品经理总结】本次讨论达成共识：SaaS 的成功在于持续交付价值。核心建议是深挖垂直领域需求。'
    },
    'tech-architect': {
      1: '从技术架构角度，建议采用微服务设计以支持未来的水平扩展。同时，数据的安全性和一致性是底层设计的重中之重。',
      2: '针对产品经理提出的 MVP 目标，技术上可以先通过容器化部署来提高交付效率。对于质疑者提到的风险，我们可以引入监控预警系统。',
      3: '我的最终结论是：架构设计应保持灵活性，前期虽然会有一定开发成本，但能避免后期的技术债务堆积。',
      4: '【架构师总结】技术支撑业务，业务驱动技术。共识点在于建立高可用的基础底座。'
    },
    'growth-strategist': {
      1: '增长的关键在于找到产品的“北极星指标”。我们需要设计一套闭环的推荐机制，利用社交裂变降低获客成本。',
      2: '我非常认可设计提出的用户留存策略。但对于产品经理说的做减法，我建议保留分享功能，那是增长的引擎。',
      3: '最终立场：SaaS 必须走数据驱动增长的道路。通过 A/B 测试不断优化转化路径是成功的必然选择。',
      4: '【增长专家总结】增长不是魔术，而是科学。大家一致认为需要建立完善的数据分析体系。'
    },
    'ux-designer': {
      1: '用户体验不只是视觉，更是流程。我建议通过极简的导航设计降低用户的认知负荷，让新用户能在一分钟内上手。',
      2: '产品经理提到的功能优先级我没意见，但 UI 上需要给核心功能更强的视觉暗示。架构师提到的性能对加载体验也很关键。',
      3: '总结立场：好的 SaaS 产品应该是“透明”的，让用户专注于任务本身而非工具的操作。交互上应追求极致的流畅。',
      4: '【设计师总结】以人为本是核心。讨论显示，极简主义和高效反馈是产品设计的共同追求。'
    },
    'skeptic': {
      1: '我必须泼盆冷水。市场上的同类产品已经很多了，我们的差异化竞争力到底在哪里？目前的乐观估计可能忽略了获客成本的攀升。',
      2: '大家的方案听起来都很美好，但如果核心技术选型出现偏差，或者增长实验失败，我们有 Plan B 吗？',
      3: '我的收敛判断：虽然方案可行，但必须建立严格的风险防控机制，尤其是资金链和技术选型的容错度。',
      4: '【质疑者总结】居安思危。本次讨论虽然乐观，但也识别出了几个关键的技术和市场风险点。'
    }
  };

  const content = responses[roleId]?.[round] || responses[roleId]?.[1] || '收到，我会继续思考。';
  return createMockLLMResponse(content, params.model);
}
