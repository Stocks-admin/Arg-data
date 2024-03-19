import express from "express";
import moment from "moment";
import {
  filterStocks,
  getCurrentMultiStockValue,
  getLastStockValue,
  getRandomStocks,
  getStockValueOnDate,
  getStockValueOnDateRange,
  getSymbolInfo,
} from "../controllers/stocksController.js";
import { searchItem } from "../controllers/itemController.js";

const stocks = express.Router();

stocks.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      res.status(200).send([]);
    }
    const stocks = await searchItem(query);
    if (!stocks) {
      res.status(200).send([]);
    }
    res.status(200).json(stocks);
  } catch (error) {
    res.status(200).send([]);
  }
});

stocks.get("/current-value/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { market } = req.query;
    if (!symbol) {
      throw new Error("No symbol provided");
    }
    const stock = await getLastStockValue(symbol, market.toUpperCase());
    if (!stock) {
      throw new Error("No stock value found");
    }
    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

stocks.get("/multi-current-value", async (req, res) => {
  try {
    const { symbols, markets } = req.query;
    if (!symbols || !markets) {
      throw new Error("No symbols provided");
    }
    const symbolsArray = symbols.split(",");
    const marketsArray = markets.split(",");
    if (
      !symbolsArray ||
      !Array.isArray(symbolsArray) ||
      symbolsArray.length === 0 ||
      !marketsArray ||
      !Array.isArray(marketsArray) ||
      marketsArray.length === 0 ||
      symbolsArray.length !== marketsArray.length
    ) {
      throw new Error("No stocks provided");
    }
    const stocks = await getCurrentMultiStockValue(symbolsArray, marketsArray);
    if (!stocks) {
      throw new Error("No stocks found");
    }
    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

stocks.get("/stock-on-date/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { date, market } = req.query;
    if (!symbol) {
      throw new Error("No symbol provided");
    }
    if (!date) {
      throw new Error("No date provided");
    }
    //Check if date is valid and before yesterday
    if (
      !moment(date).isValid() ||
      moment(date).isAfter(moment().subtract(1, "days"))
    ) {
      throw new Error("Invalid date");
    }
    const stock = await getStockValueOnDate(symbol, market.toUpperCase(), date);
    if (!stock) {
      throw new Error("No stock value found");
    }
    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

stocks.get("/stock-on-date-range/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { dateStart, dateEnd } = req.query;
    if (!symbol) {
      throw new Error("No symbol provided");
    }
    if (!dateStart) {
      throw new Error("No start date provided");
    }
    //Check if dateStart is valid and before yesterday
    if (
      !moment(dateStart, "DD-MM-YYYY").isValid() ||
      moment(dateStart, "DD-MM-YYYY").isAfter(moment().subtract(1, "days"))
    ) {
      throw new Error("Invalid date");
    }
    const stock = await getStockValueOnDateRange(symbol, dateStart, dateEnd);
    if (!stock) {
      throw new Error("No stock value found");
    }
    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

stocks.get("/random-stocks", async (req, res) => {
  try {
    const { limit } = req.query;
    const stocks = await getRandomStocks(limit);
    if (!stocks) {
      throw new Error("No stocks found");
    }
    res.status(200).json(stocks);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

stocks.get("/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      throw new Error("No symbol provided");
    }
    const stock = await getSymbolInfo(symbol);
    if (!stock) {
      throw new Error("No stock found");
    }
    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

stocks.post("/verifyStocks", async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      throw new Error("No stocks found");
    }
    const itemsEncountered = await filterStocks(symbols);
    const symbolsEncountered = itemsEncountered.map(
      (item) => item.stock_symbol
    );
    const filteredSymbols = symbols.filter((symbol) =>
      symbolsEncountered.includes(symbol)
    );
    res.status(200).json([...new Set(filteredSymbols)]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

stocks.get("/batch", async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      throw new Error("No symbol provided");
    }
    const stock = await getSymbolInfo(symbol);
    if (!stock) {
      throw new Error("No stock found");
    }
    let batch = 1;
    if (stock.batch) {
      batch = stock?.batch;
    }
    res.status(200).json({ value: batch });
  } catch (error) {
    res.status(200).json({ value: 1 });
  }
});

export default stocks;
