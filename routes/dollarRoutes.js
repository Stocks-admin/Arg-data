import express from "express";
import pkg from "apicache";
import {
  getDollarValueOnDate,
  getDollarValueOnDateRange,
  getDollarValueOnDates,
  getLastDollarValue,
} from "../controllers/dollarController.js";
import moment from "moment";

const { middleware } = pkg;
const dollar = express.Router();
const cache = middleware;

dollar.get("/current-dollar", async (req, res) => {
  try {
    const dollar = await getLastDollarValue();
    if (!dollar) {
      res.status(500).json({ message: "No dollar value found" });
    }
    res.status(200).json(dollar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

dollar.get("/dollar-on-date", async (req, res) => {
  try {
    const { date } = req.query;
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
    const dollar = await getDollarValueOnDate(date);
    if (!dollar) {
      throw new Error("No dollar value found");
    }
    res.status(200).json(dollar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

dollar.get("/dollar-on-date-range", async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.params;
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
    const dollar = await getDollarValueOnDateRange(dateFrom, dateTo);
    if (!dollar) {
      res.status(404).json({ message: "No dollar value found" });
    }
    res.status(200).json(dollar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

dollar.get("dollar-on-dates", async (req, res) => {
  try {
    const { dates } = req.body;
    if (!dates) {
      throw new Error("No dates provided");
    }
    //Check if dates are valid and before yesterday
    const arrayOfDates = dates.split(",");

    if (
      arrayOfDates.some(
        (date) =>
          !moment(date).isValid() ||
          moment(date).isAfter(moment().subtract(1, "days"))
      )
    ) {
      throw new Error("Invalid dates");
    }

    const dollar = await getDollarValueOnDates(dates);
    if (!dollar) {
      res.status(404).json({ message: "No dollar value found" });
    }
    res.status(200).json(dollar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default dollar;
