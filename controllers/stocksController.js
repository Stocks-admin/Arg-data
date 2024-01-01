import { PrismaClient } from "@prisma/client";
import {
  fetchLastStockValue,
  fetchSymbolValueOnDate,
} from "./infoController.js";
import { isToday } from "../helpers/dateHelpers.js";
import moment from "moment";

const prisma = new PrismaClient();

export async function getLastStockValue(symbol, market = "nASDAQ") {
  let lastStock = await prisma.item.findFirst({
    where: {
      stock_symbol: symbol,
    },
    select: {
      value: true,
      date: true,
      type: true,
      Organization: {
        select: {
          symbol: true,
          org_category: true,
          logo: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });
  if (!lastStock) {
    lastStock = await prisma.item.create({
      data: {
        value: 0,
        date: new Date(),
        type: "Stock",
        Organization: {
          connectOrCreate: {
            where: {
              symbol,
            },
            create: {
              symbol,
            },
          },
        },
      },
    });
  }
  let dollarValue = {
    value: lastStock?.value,
    date: moment(lastStock?.date).tz("America/Argentina/Buenos_Aires").format(),
  };
  if (!isToday(lastStock.date)) {
    dollarValue = await fetchLastStockValue(symbol, market);
    if (!dollarValue) {
      throw new Error("No dollar value found");
    }
  }
  const { value, date } = dollarValue;
  return {
    value,
    date: moment(date).tz("America/Argentina/Buenos_Aires").format(),
    organization: lastStock.Organization,
  };
}

export async function getStockValueOnDate(symbol, market = "NASDAQ", date) {
  try {
    let symbolValue = await prisma.item.findFirst({
      where: {
        stock_symbol: symbol,
        market,
        date: {
          gte: moment
            .tz("America/Argentina/Buenos_Aires")
            .startOf("day")
            .toDate(),
          lte: moment
            .tz("America/Argentina/Buenos_Aires")
            .endOf("day")
            .toDate(),
        },
      },
    });

    if (!symbolValue) {
      try {
        const symbolOnDate = await fetchSymbolValueOnDate(symbol, market, date);
        if (symbolOnDate) {
          symbolValue = {
            value: symbolOnDate.value,
            date: moment(symbolOnDate.date)
              .tz("America/Argentina/Buenos_Aires")
              .format(),
          };
        }
      } catch (error) {
        const nearestValue = await prisma.item.findFirst({
          where: {
            stock_symbol: symbol,
            market,
            date: {
              lte: moment(date).toDate(),
            },
          },
          orderBy: {
            date: "desc",
          },
        });

        if (!nearestValue) {
          throw new Error("No value found");
        }

        symbolValue = {
          value: nearestValue.value,
          date: moment(nearestValue.date)
            .tz("America/Argentina/Buenos_Aires")
            .format(),
        };
      }
    }

    return symbolValue;
  } catch (error) {
    throw new Error(error.message || "Error fetching symbol value");
  }
}

export async function getStockValueOnDateRange(symbol, dateStart, dateEnd) {
  if (!dateEnd) {
    dateEnd = new Date();
  }
  const stocksValue = await prisma.item.findMany({
    where: {
      stock_symbol: symbol,
      date: {
        gte: moment(dateStart).toDate(),
        lte: moment(dateEnd).toDate(),
      },
    },
  });
  return stocksValue.map((stock) => ({
    ...stock,
    date: moment(stock.date).tz("America/Argentina/Buenos_Aires").format(),
  }));
}

async function symbolInfo(symbol) {
  return {
    stock: await prisma.organization.findFirst({
      where: {
        symbol,
      },
    }),
    bond: await prisma.bond.findFirst({
      where: {
        symbol,
      },
    }),
    currency: await prisma.currency.findFirst({
      where: {
        symbol,
      },
    }),
  };
}

export async function getSymbolInfo(symbol) {
  const symbolType = await prisma.item.findFirst({
    where: {
      stock_symbol: symbol,
    },
  });
  if (!symbolType) {
    throw new Error("Symbol not found");
  }
  return (await symbolInfo(symbol))[symbolType.type.toLowerCase()];
}

export async function getOrgInfo(symbol) {
  return await prisma.organization.findFirst({
    where: {
      symbol,
    },
  });
}

export async function getRandomStocks(limit = 10) {
  try {
    const ids = Array.from({ length: limit }, () =>
      Math.floor(Math.random() * (4116 - 5116) + 5116)
    );
    return await prisma.item.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

export async function filterStocks(symbols) {
  try {
    const filteredSymbols = [...new Set(symbols)].filter(
      (symbol) => typeof symbol === "string"
    );
    return await prisma.item.findMany({
      where: {
        stock_symbol: {
          in: filteredSymbols,
        },
      },
    });
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}
