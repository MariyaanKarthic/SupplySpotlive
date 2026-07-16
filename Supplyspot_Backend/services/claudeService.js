const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.client = new Anthropic({
      apiKey: this.apiKey,
    });
    
    if (!this.apiKey) {
      console.warn('Claude API key not found in environment variables');
    }
  }

  async sendMessage(message, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Claude API key is not configured');
      }

      const response = await this.client.messages.create({
        model: options.model || 'claude-3-sonnet-20240229',
        max_tokens: options.maxTokens || 1024,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      });

      return response;
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error(`Claude API request failed: ${error.message}`);
    }
  }

  async analyzeDocument(documentText, analysisType = 'general') {
    const prompts = {
      general: `Please analyze this document and provide a summary: ${documentText}`,
      invoice: `Please analyze this invoice document and extract key information like vendor, amount, date, and line items: ${documentText}`,
      dispute: `Please analyze this document for potential dispute issues and flag any concerns: ${documentText}`
    };

    const prompt = prompts[analysisType] || prompts.general;
    return this.sendMessage(prompt);
  }
}

module.exports = new ClaudeService();
