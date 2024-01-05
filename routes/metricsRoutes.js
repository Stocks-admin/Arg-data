import express from "express";
import moment from "moment";
import {
  getLastUvaValue,
  getUvaValueOnDate,
  getUvaValueOnDateRange,
} from "../controllers/uvaController.js";
import pkg from "apicache";

const metrics = express.Router();
const { middleware } = pkg;
const cache = middleware;

metrics.get("/current-uva", [cache("3 hours")], async (req, res) => {
  try {
    const uva = await getLastUvaValue();
    if (!uva) {
      res.status(404).json({ message: "No UVA value found" });
    }
    res.status(200).json(uva);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

metrics.get("/uva-on-date", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      throw new Error("No date provided");
    }
    //Check if date is valid and before yesterday
    console.log(date);
    if (
      !moment(date).isValid() ||
      moment(date).isAfter(moment().subtract(1, "days"))
    ) {
      throw new Error("Invalid date");
    }
    const uva = await getUvaValueOnDate(date);
    if (!uva) {
      throw new Error("No UVA value found");
    }
    res.status(200).json(uva);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

metrics.get("/uva-on-date-range", async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    if (!dateFrom) {
      throw new Error("No date provided");
    }
    //Check if dateFrom is valid and before yesterday
    if (
      !moment(dateFrom).isValid() ||
      moment(dateFrom).isAfter(moment().subtract(1, "days"))
    ) {
      throw new Error("Invalid date");
    }
    const uva = await getUvaValueOnDateRange(dateFrom, dateTo);
    if (!uva) {
      throw new Error("No UVA value found");
    }
    res.status(200).json(uva);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default metrics;
