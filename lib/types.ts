export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: {
      input_cost_usd: number;
      output_cost_usd: number;
      total_cost_usd: number;
      pricing_rate: {
        input: number;
        output: number;
      }
    }
    model: string;
  }
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
}
