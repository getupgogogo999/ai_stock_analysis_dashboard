const { getRequired, getOptional } = require("../config/env");
const { getFetch } = require("../utils/fetchWithProxy");

const ANALYSIS_PROMPT = `你是一位专业的 A 股市场与美股分析师。你的读者是中文用户。

【输出格式】
只返回一个 JSON 对象，包含三个键：summary、sentiment、risk_level。不要 markdown，不要代码块。

【summary — 必须用简体中文】
- 写 2-4 句完整中文
- 涵盖：价格走势、估值或基本面、简要 outlook
- 禁止在 summary 中使用英文单词或英文句子（公司名 AAPL、Apple 等专有名词除外）

【sentiment — 仅英文枚举】
只能是："Bullish"、"Neutral"、"Bearish"

【risk_level — 仅英文枚举】
只能是："Low"、"Medium"、"High"

【示例】
{"summary":"苹果近期温和上涨，较前一交易日小幅走高。股价接近52周高位，市场关注度较高，需留意估值压力。整体基本面仍较稳健，短期展望偏积极。","sentiment":"Bullish","risk_level":"Medium"}`;

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

/** summary 中中文字符占比，用于检测是否仍为英文输出 */
function chineseCharRatio(text) {
  const chars = [...text];
  if (!chars.length) return 0;
  const cjk = chars.filter((c) => /[\u4e00-\u9fff]/.test(c)).length;
  return cjk / chars.length;
}

function isSummaryChinese(summary) {
  return chineseCharRatio(summary) >= 0.25 || /[\u4e00-\u9fff].{4,}/.test(summary);
}

function buildUserMessage(stockData, mlPrediction) {
  let msg = `请用中文撰写 summary，分析以下股票数据：\n${JSON.stringify(stockData, null, 2)}`;
  if (mlPrediction?.metrics) {
    msg += `\n\nML 融合预测（仅供参考）：\n${JSON.stringify(mlPrediction.metrics, null, 2)}`;
  }
  msg += "\n\n再次强调：summary 字段必须是简体中文，不要写英文。";
  return msg;
}

async function requestAnalysis(apiFetch, baseUrl, apiKey, model, messages) {
  const response = await apiFetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  return validateAnalysis(extractJson(content));
}

async function analyzeStock(stockData, mlPrediction = null) {
  const apiKey = getRequired("OPENAI_API_KEY");
  const model = getOptional("OPENAI_MODEL", "gpt-4o-mini");
  const baseUrl = getOptional("OPENAI_BASE_URL", "https://api.openai.com/v1").replace(/\/$/, "");
  const apiFetch = getFetch();
  const userMessage = buildUserMessage(stockData, mlPrediction);

  const messages = [
    { role: "system", content: ANALYSIS_PROMPT },
    { role: "user", content: userMessage },
  ];

  try {
    let result = await requestAnalysis(apiFetch, baseUrl, apiKey, model, messages);

    if (!isSummaryChinese(result.summary)) {
      const retryMessages = [
        ...messages,
        { role: "assistant", content: JSON.stringify(result) },
        {
          role: "user",
          content:
            "你的 summary 不是中文。请只重新生成 JSON，summary 改为 2-4 句简体中文，sentiment 和 risk_level 保持不变。",
        },
      ];
      result = await requestAnalysis(apiFetch, baseUrl, apiKey, model, retryMessages);
    }

    return result;
  } catch (err) {
    if (
      err.message.includes("OpenAI API") ||
      err.message.includes("parse") ||
      err.message.includes("LLM") ||
      err.message.includes("Missing")
    ) {
      throw err;
    }
    throw new Error(
      `无法连接 OpenAI（${err.cause?.code || err.message}）。浏览器能访问但 Node 超时时，请在 .env 添加 HTTPS_PROXY=http://127.0.0.1:你的代理端口（如 Clash 默认 7890）。`
    );
  }
}

module.exports = { analyzeStock, ANALYSIS_PROMPT, isSummaryChinese };
