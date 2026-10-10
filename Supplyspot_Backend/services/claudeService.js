const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../config/logger');

// Model and key come from the environment so they can change without a code edit.
const DEFAULT_MODEL = 'claude-sonnet-4-6';

// Errors carry an HTTP status so routes can pass them straight to the client.
class AiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

class ClaudeService {
  constructor() {
    this.client = null;
  }

  get apiKey() {
    // CLAUDE_API_KEY is the older name used in early .env files.
    return process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
  }

  get model() {
    return process.env.CLAUDE_MODEL || DEFAULT_MODEL;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  getClient() {
    if (!this.isConfigured()) {
      throw new AiError(503, 'AI features are off: set ANTHROPIC_API_KEY in the backend .env and restart the server');
    }
    if (!this.client || this.client.apiKey !== this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey, maxRetries: 2, timeout: 60 * 1000 });
    }
    return this.client;
  }

  /**
   * Asks Claude for a JSON object that matches `schema` (structured outputs) and returns it parsed.
   * `data` is sent as a JSON block after the instructions so records never mix with the prompt text.
   */
  async generateJson({ system, instructions, data, schema, maxTokens = 4000, effort = 'medium' }) {
    const client = this.getClient();
    const started = Date.now();
    let response;
    try {
      response = await client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        system,
        output_config: { effort, format: { type: 'json_schema', schema } },
        messages: [{
          role: 'user',
          content: `${instructions}\n\n<data>\n${JSON.stringify(data)}\n</data>`,
        }],
      });
    } catch (error) {
      throw this.toAiError(error);
    }

    logger.info('Claude request', {
      model: response.model,
      ms: Date.now() - started,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
      stopReason: response.stop_reason,
    });

    if (response.stop_reason === 'refusal') {
      throw new AiError(422, 'Claude declined to answer this request');
    }
    if (response.stop_reason === 'max_tokens') {
      throw new AiError(502, 'Claude\'s answer was cut off; try again with less data');
    }
    const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    try {
      return JSON.parse(text);
    } catch (error) {
      logger.error('Claude returned invalid JSON', { text: text.slice(0, 500) });
      throw new AiError(502, 'Claude returned an answer that could not be read');
    }
  }

  toAiError(error) {
    if (error instanceof AiError) return error;
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      logger.error('Claude API auth error:', error.message);
      return new AiError(503, 'The Claude API key was rejected; check ANTHROPIC_API_KEY');
    }
    if (error instanceof Anthropic.RateLimitError) {
      return new AiError(429, 'Claude is rate limited right now; try again in a minute');
    }
    if (error instanceof Anthropic.BadRequestError || error instanceof Anthropic.NotFoundError) {
      logger.error('Claude API request error:', error.message);
      return new AiError(502, `Claude rejected the request: ${error.message}`);
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return new AiError(503, 'Could not reach the Claude API');
    }
    if (error instanceof Anthropic.APIError) {
      logger.error('Claude API error:', error.message);
      return new AiError(502, 'The Claude API returned an error; try again');
    }
    logger.error('Claude service error:', error);
    return new AiError(500, 'AI request failed');
  }
}

const claudeService = new ClaudeService();
module.exports = claudeService;
module.exports.AiError = AiError;
