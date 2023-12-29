//Import prisma client
import { PrismaClient } from "@prisma/client";
import {
  fetchLastStockValue,
  fetchSymbolValueOnDate,
} from "./infoController.js";
import { isToday } from "../helpers/dateHelpers.js";
import moment from "moment";

//Instantiate prisma client
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
    date: lastStock?.date,
  };
  if (!isToday(lastStock.date)) {
    dollarValue = await fetchLastStockValue(symbol, market);
    if (!dollarValue) {
      throw new Error("No dollar value found");
    }
  }
  const { value, date } = dollarValue;
  return { value, date, organization: lastStock.Organization };
}

export async function getStockValueOnDate(symbol, market = "NASDAQ", date) {
  const stockMarket =
    market.toUpperCase() === "CEDEARS" ? "BCBA" : market.toUpperCase();
  let symbolValue = await prisma.item.findFirst({
    where: {
      stock_symbol: symbol,
      market: stockMarket.toUpperCase(),
      date: moment(date, "YYYY-MM-DD").toDate(),
    },
  });
  if (!symbolValue) {
    try {
      const symbolOnDate = await fetchSymbolValueOnDate(
        symbol,
        stockMarket,
        date
      );

      if (!symbolOnDate) {
        throw new Error("No value found");
      }
      symbolValue = await prisma.item.create({
        data: {
          value: symbolOnDate.value,
          date: moment(date, "YYYY-MM-DD").toDate(),
          type: "Stock",
          market: stockMarket,
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
      symbolValue = {
        value: symbolValue.value,
        date: symbolValue.date,
      };
    } catch (error) {
      console.log(error);
      throw new Error("No value found");
    }
  }
  return symbolValue;
}

export async function getStockValueOnDateRange(symbol, dateStart, dateEnd) {
  if (!dateEnd) {
    dateEnd = new Date();
  }
  return await prisma.item.findMany({
    where: {
      stock_symbol: symbol,
      date: {
        gte: moment(dateStart, "DD-MM-YYYY").toDate(),
        lte: moment(dateEnd, "DD-MM-YYYY").toDate(),
      },
    },
  });
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
      Math.floor(Math.random() * 1000)
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
    console.log(filteredSymbols);
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
