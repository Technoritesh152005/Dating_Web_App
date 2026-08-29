const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

const ALLOWED_SIGNALS = new Set([
  "rapid_trust_building",
  "off_platform_move",
  "money_request",
  "crypto_or_investment",
  "urgency_or_secrecy",
  "credential_request",
]);

export async function detectScamRisk(messages) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not Provided / Configured");
  }

  const conversation = messages
    .slice()
    .reverse()
    .map((message) => `${message.speaker} : ${message.content}`)
    .join("\n");

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `
                    You are a dating-app safety classifier.

Analyze the conversation for a strong combined scam pattern:
rapid trust-building plus moving off-platform plus money, crypto, investment,
gift card, fee, password, verification-code, or financial pressure.

Do not classify based on one weak signal alone.
Return only valid JSON with this exact shape: 
{
  "risk": "HIGH" or "NONE",
  "confidence": "LOW" or "MEDIUM" or "HIGH",
  "signals": [],
  "explanation": ""
}

Use only these signal names:
rapid_trust_building
off_platform_move
money_request
crypto_or_investment
urgency_or_secrecy
credential_request

Use HIGH only when multiple strong signals appear together.
Do not include personal data or repeat the conversation.
                    `.trim(),
        },
        {
          role: "user",
          content: conversation,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Groq scam detection failed: ${response.status} ${errorBody}`,
    );
  }

  const data = await response.json();
  const rawPureData = data?.choices?.[0]?.message?.content;

  if (!rawPureData) {
    throw new Error("Groq returned no scam detection result");
  }

  let result;
  try {
    result = JSON.parse(rawPureData);
  } catch (err) {
    throw new Error("Groq returned invalid response Json. Unable to Parse");
  }

  const signals = Array.isArray(result.signals)
    ? result.signals.filter((signal) => ALLOWED_SIGNALS.has(signal))
    : [];

  return {
    signals,
    risk: result.risk === "HIGH" ? "HIGH" : "NONE",
    confidence: ["LOW", "MEDIUM", "HIGH"].includes(result.confidence)
      ? result.confidence
      : "LOW",
    explanation:
      typeof result.explanation === "string"
        ? result.explanation.slice(0, 500)
        : null,
  };
}
