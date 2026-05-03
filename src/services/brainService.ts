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
    const concepts = ["quantum", "qubit", "nanotube", "neuron", "llm", "agi"];
    concepts.forEach(c => {
      if (textLower.includes(c)) {
        this.entities[c] = (this.entities[c] || 0) + 1;
      }
    });
  }
}

export class Brain {
  private encoder = new NeuralEncoder();
  private worldModel = new WorldModel();
  private cycle = 0;
  private memories: { text: string; vec: number[]; cycle: number }[] = [];

  async think(input: string, domain: string = "general") {
    this.cycle++;
    this.worldModel.updateFromText(input);

    const inputVec = this.encoder.encode(input);
    this.memories.push({ text: input, vec: inputVec, cycle: this.cycle });
    if (this.memories.length > 100) this.memories.shift();

    const res = await fetch("/api/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, domain, cycle: this.cycle - 1 }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Brain API error ${res.status}: ${err}`);
    }

    const data = await res.json();

    return {
      ...data,
      world_model: {
        entities: Object.keys(this.worldModel.entities).length,
        relations: this.worldModel.relations.length,
      },
      // Validate domain exists; fall back to general for unknown values.
      domain: ALL_DOMAINS[domain] ? domain : "general",
    };
  }
}
