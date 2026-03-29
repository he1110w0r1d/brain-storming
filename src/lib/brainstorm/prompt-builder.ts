import { AIRole, ChatMessage } from './types';

function formatMessagesForContext(messages: ChatMessage[]): string {
  if (messages.length === 0) return '';

  return messages
    .map(msg => `[${msg.senderName}] ${msg.content}`)
    .join('\n\n---\n\n');
}

export function buildRoundOnePrompt(
  role: AIRole,
  userQuestion: string
): { systemPrompt: string; userPrompt: string } {
  const userPrompt = `# 用户问题

${userQuestion}

---

请基于你的专业角色，针对上述问题发表你的初始观点和见解。
要求：
1. 简洁有力，直接切入要点
2. 展现你的专业视角和核心判断
3. 可以提出假设条件
4. 单条消息控制在 200 字以内

你的发言：`;

  return {
    systemPrompt: role.systemPrompt,
    userPrompt,
  };
}

export function buildRoundTwoPrompt(
  role: AIRole,
  userQuestion: string,
  roundOneMessages: ChatMessage[]
): { systemPrompt: string; userPrompt: string } {
  const roundOneContext = formatMessagesForContext(roundOneMessages);

  const userPrompt = `# 用户原始问题

${userQuestion}

# 第一轮讨论

${roundOneContext}

---

现在进入第二轮讨论。
请基于第一轮的观点，发表你的回应：
1. 可以赞同、补充他人的观点
2. 可以反驳、质疑他人的判断
3. 可以修正自己上一轮的看法
4. 尝试找到不同观点之间的联系

要求：简洁有力，单条消息控制在 250 字以内。

你的发言：`;

  return {
    systemPrompt: role.systemPrompt,
    userPrompt,
  };
}

export function buildRoundThreePrompt(
  role: AIRole,
  userQuestion: string,
  roundOneMessages: ChatMessage[],
  roundTwoMessages: ChatMessage[]
): { systemPrompt: string; userPrompt: string } {
  const roundOneContext = formatMessagesForContext(roundOneMessages);
  const roundTwoContext = formatMessagesForContext(roundTwoMessages);

  const userPrompt = `# 用户问题

${userQuestion}

# 第一轮观点

${roundOneContext}

# 第二轮交锋

${roundTwoContext}

---

现在进入第三轮，也是最后一轮。
请综合前两轮的讨论，形成你的最终立场：
1. 综合考虑各方观点和争议
2. 给出你的收敛判断和最终建议
3. 说明支撑你判断的核心依据
4. 如果有仍未解决的争议，明确指出

要求：体现深思熟虑后的专业判断，单条消息控制在 300 字以内。

你的最终立场：`;

  return {
    systemPrompt: role.systemPrompt,
    userPrompt,
  };
}

export function buildSummaryPrompt(
  role: AIRole,
  userQuestion: string,
  allMessages: ChatMessage[]
): { systemPrompt: string; userPrompt: string } {
  const allContext = formatMessagesForContext(allMessages);

  const userPrompt = `# 用户提出的问题

${userQuestion}

# 完整讨论记录

${allContext}

---

你是本次头脑风暴的总结者。请基于以上所有讨论，输出一份结构化的总结报告：

## 格式要求

请按以下结构输出：

### 问题重述
简要概括用户提出的核心问题

### 各方主要观点
列出每个角色（不限于）的核心观点和立场

### 争议焦点
列出讨论中存在的主要分歧和争议点

### 共识要点
列出讨论中形成的共识和一致意见

### 最终建议
综合各方观点，给出你的最终建议或答案

---

要求：
1. 客观中立，不偏袒任何一方
2. 突出重点，不重复罗列
3. 结构清晰，便于阅读
4. 总字数控制在 500 字以内
5. 语言要像群聊总结，不要像论文

总结报告：`;

  return {
    systemPrompt: `${role.systemPrompt}

你同时也是本次头脑风暴的总结者。请以中立、客观的视角，综合所有观点，形成结构化的总结报告。`,
    userPrompt,
  };
}

export function buildSystemMessage(
  round: number,
  messageType: 'start' | 'end' | 'transition'
): string {
  const roundDescriptions: Record<number, string> = {
    1: '第一轮：初始观点',
    2: '第二轮：交锋讨论',
    3: '第三轮：收敛判断',
  };

  if (messageType === 'start') {
    return `【${roundDescriptions[round]}】开始`;
  } else if (messageType === 'end') {
    return `【${roundDescriptions[round]}】结束`;
  } else {
    return `【${roundDescriptions[round]}】进行中`;
  }
}
