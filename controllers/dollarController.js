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

  if (!dollarValue) {
    throw new Error("No dollar value found");
  }
  if (!isToday(dollarValue.date)) {
    try {
      const { value, date } = await fetchLastDolarValue();
      return {
        value,
        date: moment(date).tz("America/Argentina/Buenos_Aires").format(),
      };
    } catch (error) {
      const { value, date } = dollarValue;
      return {
        value,
        date: moment(date).tz("America/Argentina/Buenos_Aires").format(),
      };
    }
  } else {
    const { value, date } = dollarValue;
    return {
      value,
      date: moment(date).tz("America/Argentina/Buenos_Aires").format(),
    };
  }
}

export async function getDollarValueOnDate(date) {
  const valueOnDate = await prisma.item.findFirst({
    where: {
      currency_symbol: "USD",
      date: moment(date, "DD-MM-YYYY").toDate(),
    },
  });

  return {
    ...valueOnDate,
    date: moment(valueOnDate.date)
      .tz("America/Argentina/Buenos_Aires")
      .format(),
  };
}

export async function getDollarValueOnDateRange(dateStart, dateEnd) {
  const valueOnDate = await prisma.item.findMany({
    where: {
      currency_symbol: "USD",
      date: {
        gte: moment(dateStart, "DD-MM-YYYY").toDate(),
        lte: moment(dateEnd, "DD-MM-YYYY").toDate(),
      },
    },
  });

  return valueOnDate.map((value) => ({
    ...value,
    date: moment(value.date).tz("America/Argentina/Buenos_Aires").format(),
  }));
}
