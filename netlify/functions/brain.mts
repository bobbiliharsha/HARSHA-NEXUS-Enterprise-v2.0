import { GoogleGenAI } from '@google/genai';
import { ALL_DOMAINS } from '../../src/types';

const PII_PATTERNS: Record<string, RegExp> = {
  SSN: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/gi,
  CREDIT_CARD: /\b(?:\d{4}[-\s]?){3}\d{4}\b/gi,
  PHONE: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/gi,
  EMAIL: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/gi,
  IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b/gi,
  DOB: /\b(?:0?[1-9]|1[0-2])[/\-](?:0?[1-9]|[12]\d|3[01])[/\-](?:19|20)\d{2}\b/gi,
  PASSPORT: /\b[A-Z]{1,2}\d{6,9}\b/gi,
  API_KEY: /\bsk-[a-zA-Z0-9\-_]{20,}\b/gi,
};

function sanitize(text: string): { clean: string; findings: { type: string; value: string }[] } {
  let clean = text;
  const findings: { type: string; value: string }[] = [];
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => findings.push({ type, value: m.substring(0, 4) + '***' }));
      clean = clean.replace(pattern, `[${type}]`);
    }
  }
  return { clean, findings };
}

function parseToolCalls(text: string) {
  const pattern = /\[TOOL:(\w+)\|(.*?)\]/g;
  const calls: { tool: string; params: Record<string, string>; raw: string }[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const params: Record<string, string> = {};
    match[2].split('|').forEach(kv => {
      const [k, v] = kv.split('=');
      if (k && v) params[k.trim()] = v.trim();
    });
    calls.push({ tool: match[1], params, raw: match[0] });
  }
  return calls;
}

async function dispatchTool(tool: string, params: Record<string, string>) {
  switch (tool) {
    case 'timestamp':
      return { result: new Date().toISOString(), ok: true };
    case 'calculator':
      try {
        // eslint-disable-next-line no-eval
        const res = eval(params.expression);
        return { result: `${params.expression} = ${res}`, ok: true };
      } catch {
        return { result: 'Error', ok: false };
      }
    default:
      return { result: `Tool ${tool} executed with params ${JSON.stringify(params)}`, ok: true };
  }
}

const ai = new GoogleGenAI({});

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: { input?: string; domain?: string; cycle?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = (body.input || '').toString();
  const domain = (body.domain || 'general').toString();
  const cycle = Number(body.cycle || 0) + 1;

  if (!input.trim()) {
    return Response.json({ error: 'input is required' }, { status: 400 });
  }

  const { clean, findings } = sanitize(input);
  const domainInfo = ALL_DOMAINS[domain] || ALL_DOMAINS.general;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: clean,
    config: {
      systemInstruction: `${domainInfo.system}\n\nCycle: ${cycle}`,
    },
  });

  let text = response.text || '';
  const toolCalls = parseToolCalls(text);
  const toolResults: { result: string; ok: boolean }[] = [];

  for (const tc of toolCalls) {
    const res = await dispatchTool(tc.tool, tc.params);
    toolResults.push(res);
    text = text.replace(tc.raw, `[Result: ${res.result}]`);
  }

  return Response.json({
    response: text,
    cycle,
    phi: 0.1 + cycle * 0.05,
    pii_redacted: findings.length > 0,
    tool_calls: toolResults,
    world_model: { entities: 0, relations: 0 },
  });
};

export const config = {
  path: '/api/brain',
};
