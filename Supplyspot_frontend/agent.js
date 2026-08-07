import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || "",
});

async function main() {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        { role: "user", content: "Explain TDS filing in India" }
      ],
    });

    console.log(msg.content[0].text);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
