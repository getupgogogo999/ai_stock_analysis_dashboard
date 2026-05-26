const express = require("express");
const { fetchStockData, fetchStockCandles } = require("../services/stockService");
const { analyzeStock } = require("../services/llmService");
const { saveAnalysis, getAnalysisHistory } = require("../services/supabaseClient");

const router = express.Router();

router.get("/stock/:symbol/chart", async (req, res) => {
  try {
    const range = req.query.range || "3m";
    const data = await fetchStockCandles(req.params.symbol, range);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/stock/:symbol", async (req, res) => {
  try {
    const data = await fetchStockData(req.params.symbol);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/analyze", async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({ success: false, error: "symbol is required" });
    }

    const stockData = await fetchStockData(symbol);
    const analysis = await analyzeStock(stockData);

    const saved = await saveAnalysis({
      symbol: stockData.symbol,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      risk_level: analysis.risk_level,
      stock_data: stockData,
    });

    res.json({ success: true, data: { stockData, analysis, saved } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/history", async (_req, res) => {
  try {
    const history = await getAnalysisHistory();
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
