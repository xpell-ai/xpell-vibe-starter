import {
  XAIProvider,
  XAIInput,
  XAIResult,
} from "@xpell/node";

type AzureConfig = {
  endpoint: string;
  apiKey: string;
  deployment: string;
};

export class AzureProvider implements XAIProvider {
  private _config: AzureConfig;
  private _client: any;

  constructor(config: AzureConfig) {
    this._config = config;
  }

  private async getClient() {
    if (this._client) return this._client;

    const mod = await import("@azure/openai");

    const AzureOpenAI =
      (mod as any).AzureOpenAI ??
      (mod as any).default?.AzureOpenAI;

    if (!AzureOpenAI) {
      throw new Error("AzureOpenAI export not found — check SDK version");
    }

    this._client = new AzureOpenAI({
      endpoint: this._config.endpoint,
      apiKey: this._config.apiKey,
      deployment: this._config.deployment,
      apiVersion: "2024-02-15-preview",
    });

    return this._client;
  }

  async generate(input: XAIInput): Promise<XAIResult> {
    const client = await this.getClient();

    const messages: any[] = [];

    if (input.system) {
      messages.push({ role: "system", content: input.system });
    }

    messages.push({ role: "user", content: input.prompt });

    const response = await client.chat.completions.create({
      messages,
      temperature: 0.2,
    });

    const text =
      response?.choices?.[0]?.message?.content?.trim?.() ?? "";

    if (!text) {
      throw new Error("Azure returned empty response");
    }

    return {
      text,
      raw: response,
    };
  }
}