//Import prisma client
import { PrismaClient } from "@prisma/client";
import { fetchLastStockValue } from "./infoController.js";
import { isToday } from "../helpers/dateHelpers.js";
import moment from "moment";

//Instantiate prisma client
const prisma = new PrismaClient();

export async function getLastStockValue(symbol) {
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
    dollarValue = await fetchLastStockValue(symbol);
    if (!dollarValue) {
      throw new Error("No dollar value found");
    }
  }
  const { value, date } = dollarValue;
  return { value, date, organization: lastStock.Organization };
}

export async function getStockValueOnDate(symbol, date) {
  return await prisma.item.findFirst({
    where: {
      stock_symbol: symbol,
      date: moment(date, "DD-MM-YYYY").toDate(),
    },
  });
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
