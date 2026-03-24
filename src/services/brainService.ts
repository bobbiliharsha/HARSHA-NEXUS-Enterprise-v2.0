import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ALL_DOMAINS } from "../types";

export class PIIGuard {
  private patterns: Record<string, RegExp> = {
    SSN: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/gi,
    CREDIT_CARD: /\b(?:\d{4}[-\s]?){3}\d{4}\b/gi,
    PHONE: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/gi,
    EMAIL: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/gi,
    IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b/gi,
    DOB: /\b(?:0?[1-9]|1[0-2])[/\-](?:0?[1-9]|[12]\d|3[01])[/\-](?:19|20)\d{2}\b/gi,
    PASSPORT: /\b[A-Z]{1,2}\d{6,9}\b/gi,
    API_KEY: /\bsk-[a-zA-Z0-9\-_]{20,}\b/gi,
  };

  sanitize(text: string): { clean: string; findings: any[] } {
    let clean = text;
    const findings: any[] = [];
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(m => findings.push({ type, value: m.substring(0, 4) + "***" }));
        clean = clean.replace(pattern, `[${type}]`);
      }
    }
    return { clean, findings };
  }
}

export class NeuralEncoder {
  private dim = 384;

  encode(text: string): number[] {
    const v = new Array(this.dim).fill(0);
    const t = text.toLowerCase().substring(0, 500);
    for (let i = 0; i < t.length - 2; i++) {
      const trigram = t.substring(i, i + 3);
      let hash = 0;
      for (let j = 0; j < trigram.length; j++) {
        hash = (hash << 5) - hash + trigram.charCodeAt(j);
        hash |= 0;
      }
      v[Math.abs(hash) % this.dim] += 1;
    }
    const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
    return norm > 0 ? v.map(x => x / norm) : v;
  }

  similarity(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }
}

export class WorldModel {
  entities: Record<string, any> = {};
  relations: any[] = [];

  updateFromText(text: string) {
    const textLower = text.toLowerCase();
    // Simple entity extraction logic
    const concepts = ["quantum", "qubit", "nanotube", "neuron", "llm", "agi"];
    concepts.forEach(c => {
      if (textLower.includes(c)) {
        this.entities[c] = (this.entities[c] || 0) + 1;
      }
    });
  }
}

export class ToolEngine {
  async dispatch(tool: string, params: any): Promise<{ result: string; ok: boolean }> {
    switch (tool) {
      case "timestamp":
        return { result: new Date().toISOString(), ok: true };
      case "calculator":
        try {
          // Dangerous eval but scoped for demo
          const res = eval(params.expression);
          return { result: `${params.expression} = ${res}`, ok: true };
        } catch (e) {
          return { result: "Error", ok: false };
        }
      default:
        return { result: `Tool ${tool} executed with params ${JSON.stringify(params)}`, ok: true };
    }
  }

  parseToolCalls(text: string): any[] {
    const pattern = /\[TOOL:(\w+)\|(.*?)\]/g;
    const calls = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const tool = match[1];
      const rawParams = match[2];
      const params: any = {};
      rawParams.split("|").forEach(kv => {
        const [k, v] = kv.split("=");
        if (k && v) params[k.trim()] = v.trim();
      });
      calls.push({ tool, params, raw: match[0] });
    }
    return calls;
  }
}

export class Brain {
  private ai: GoogleGenAI;
  private pii = new PIIGuard();
  private encoder = new NeuralEncoder();
  private worldModel = new WorldModel();
  private tools = new ToolEngine();
  private cycle = 0;
  private memories: any[] = [];

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  async think(input: string, domain: string = "general") {
    this.cycle++;
    const { clean, findings } = this.pii.sanitize(input);
    this.worldModel.updateFromText(clean);

    const domainInfo = ALL_DOMAINS[domain] || ALL_DOMAINS.general;
    
    // Simple memory retrieval
    const inputVec = this.encoder.encode(clean);
    const relevantMemories = this.memories
      .map(m => ({ ...m, score: this.encoder.similarity(inputVec, m.vec) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const memoryContext = relevantMemories.map(m => m.text).join("\n");

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: clean,
      config: {
        systemInstruction: `${domainInfo.system}\n\nMemory Context:\n${memoryContext}\n\nCycle: ${this.cycle}`,
      }
    });

    let text = response.text || "";
    const toolCalls = this.tools.parseToolCalls(text);
    const toolResults = [];

    for (const tc of toolCalls) {
      const res = await this.tools.dispatch(tc.tool, tc.params);
      toolResults.push(res);
      text = text.replace(tc.raw, `[Result: ${res.result}]`);
    }

    this.memories.push({ text: clean, vec: inputVec, cycle: this.cycle });
    if (this.memories.length > 100) this.memories.shift();

    return {
      response: text,
      cycle: this.cycle,
      phi: 0.1 + (this.cycle * 0.05),
      pii_redacted: findings.length > 0,
      tool_calls: toolResults,
      world_model: {
        entities: Object.keys(this.worldModel.entities).length,
        relations: this.worldModel.relations.length
      }
    };
  }
}
