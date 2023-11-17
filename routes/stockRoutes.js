import express from "express";
import moment from "moment";
import {
  getLastStockValue,
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
      console.log("No query provided");
      res.status(200).send([]);
    }
    const stocks = await searchItem(query);
    console.log(stocks);
    if (!stocks) {
      res.status(200).send([]);
    }
    res.status(200).json(stocks);
  } catch (error) {
    console.log(error);
    res.status(200).send([]);
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

stocks.get("/current-value/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { market } = req.query;
    if (!symbol) {
      throw new Error("No symbol provided");
    }
    const stock = await getLastStockValue(symbol, market);
    if (!stock) {
      throw new Error("No stock value found");
    }
    res.status(200).json(stock);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

stocks.get("/stock-on-date/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { date } = req.query;
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
    const stock = await getStockValueOnDate(symbol, date);
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

export default stocks;
