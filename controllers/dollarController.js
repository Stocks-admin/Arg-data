import { PrismaClient } from "@prisma/client";
import { isInMarketHours, isToday } from "../helpers/dateHelpers.js";
import { fetchLastDolarValue } from "./infoController.js";
import moment from "moment";

//Instantiate prisma client
const prisma = new PrismaClient();

export async function getLastDollarValue() {
  let dollarValue = await prisma.item.findFirst({
    where: {
      currency_symbol: "USD",
    },
    orderBy: {
      date: "desc",
    },
  });
  console.log("Last", dollarValue);
  if (!dollarValue) {
    throw new Error("No dollar value found");
  }

  if (!isToday(dollarValue.date)) {
    dollarValue = await fetchLastDolarValue();
    console.log("Today", dollarValue);
  }

  if (!dollarValue) {
    throw new Error("No dollar value found");
  }
  const { value, date } = dollarValue;
  return { value, date };
}

export function getDollarValueOnDate(date) {
  return prisma.item.findFirst({
    where: {
      currency_symbol: "USD",
      date: moment(date, "DD-MM-YYYY").toDate(),
    },
  });
}

export function getDollarValueOnDateRange(dateStart, dateEnd) {
  return prisma.item.findMany({
    where: {
      currency_symbol: "USD",
      date: {
        gte: moment(dateStart, "DD-MM-YYYY").toDate(),
        lte: moment(dateEnd, "DD-MM-YYYY").toDate(),
      },
    },
  });
}
