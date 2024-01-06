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
        date: moment.tz(date, "America/Argentina/Buenos_Aires").format(),
      };
    } catch (error) {
      const { value, date } = dollarValue;
      return {
        value,
        date: moment.tz(date, "America/Argentina/Buenos_Aires").format(),
      };
    }
  } else {
    const { value, date } = dollarValue;
    return {
      value,
      date: moment.tz(date, "America/Argentina/Buenos_Aires").format(),
    };
  }
}

export async function getDollarValueOnDate(date) {
  const valueOnDate = await prisma.item.findFirst({
    where: {
      currency_symbol: "USD",
      date: {
        gte: moment(date)
          .tz("America/Argentina/Buenos_Aires")
          .startOf("day")
          .toDate(),
        lte: moment(date)
          .tz("America/Argentina/Buenos_Aires")
          .endOf("day")
          .toDate(),
      },
    },
  });
  if (!valueOnDate) {
    const nearestValue = await prisma.item.findFirst({
      where: {
        currency_symbol: "USD",
        date: {
          lte: moment(date).toDate(),
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    return {
      ...nearestValue,
      date: moment(nearestValue.date)
        .tz("America/Argentina/Buenos_Aires")
        .format(),
    };
  }
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

export async function getDollarValueOnDates(dates) {
  const valuesOnDate = await prisma.item.findMany({
    where: {
      currency_symbol: "USD",
      date: {
        in: dates.map((date) => moment(date).toDate()),
      },
    },
  });

  return valuesOnDate.map((value) => ({
    ...value,
    date: moment(value.date).tz("America/Argentina/Buenos_Aires").format(),
  }));
}
