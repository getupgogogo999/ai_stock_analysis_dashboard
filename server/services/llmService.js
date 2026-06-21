const { getRequired, getOptional } = require("../config/env");
const { getFetch } = require("../utils/fetchWithProxy");

const ANALYSIS_PROMPT = `You are a professional stock market analyst. Analyze the provided stock market data and return your assessment.

Rules:
1. Respond ONLY with valid JSON — no markdown, no code fences, no extra text.
2. Use exactly these three keys: "summary", "sentiment", "risk_level".
3. "summary": 2-4 sentences covering price trend, valuation context, and a brief outlook.
4. "sentiment": must be exactly one of: "Bullish", "Neutral", "Bearish".
5. "risk_level": must be exactly one of: "Low", "Medium", "High".

Example output:
{"summary":"Apple shows moderate upward momentum with stable fundamentals. The stock is trading near its 52-week range midpoint, suggesting balanced risk-reward. Institutional support remains solid.","sentiment":"Bullish","risk_level":"Medium"}`;

const VALID_SENTIMENTS = new Set(["Bullish", "Neutral", "Bearish"]);
const VALID_RISK_LEVELS = new Set(["Low", "Medium", "High"]);

function validateAnalysis(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("LLM response is not a valid JSON object");
  }

  const { summary, sentiment, risk_level } = parsed;

  if (!summary || typeof summary !== "string") {
    throw new Error('Missing or invalid "summary" field');
  }
  if (!VALID_SENTIMENTS.has(sentiment)) {
    throw new Error(
      `"sentiment" must be Bullish, Neutral, or Bearish — got "${sentiment}"`
    );
  }
  if (!VALID_RISK_LEVELS.has(risk_level)) {
    throw new Error(
      `"risk_level" must be Low, Medium, or High — got "${risk_level}"`
    );
  }

  return { summary, sentiment, risk_level };
}

function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
}

async function analyzeStock(stockData, mlPrediction = null) {
  const apiKey = getRequired("OPENAI_API_KEY");
  const model = getOptional("OPENAI_MODEL", "gpt-4o-mini");
  const baseUrl = getOptional("OPENAI_BASE_URL", "https://api.openai.com/v1").replace(/\/$/, "");

  let userMessage = `Analyze this stock data:\n${JSON.stringify(stockData, null, 2)}`;
  if (mlPrediction?.metrics) {
    userMessage += `\n\nPyTorch ensemble forecast (LSTM+GRU fusion, for reference only — not financial advice):\n${JSON.stringify(mlPrediction.metrics, null, 2)}\nPredicted next ${mlPrediction.horizon || 10} sessions close path: ${JSON.stringify(mlPrediction.predicted?.map((p) => p.close) || [])}`;
  }

  const apiFetch = getFetch();

  let response;
  try {
    response = await apiFetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch (err) {
    throw new Error(
      `无法连接 OpenAI（${err.cause?.code || err.message}）。浏览器能访问但 Node 超时时，请在 .env 添加 HTTPS_PROXY=http://127.0.0.1:你的代理端口（如 Clash 默认 7890）。`
    );
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  try {
    return validateAnalysis(extractJson(content));
  } catch (err) {
    throw new Error(`Failed to parse LLM JSON: ${err.message}. Raw: ${content}`);
  }
}

module.exports = { analyzeStock, ANALYSIS_PROMPT };
