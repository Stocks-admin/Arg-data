import axios from "axios";
import { PrismaClient } from "@prisma/client";
import {
  fetchSymbolPriceIOL,
  fetchSymbolPriceIOLOnDate,
} from "../helpers/iolHelper.js";
import moment from "moment-timezone";
import { parseMarket } from "../utils/markets.js";

//Instantiate prisma client
const prisma = new PrismaClient();

export async function fetchLastDolarValue() {
  const dollar = await axios.get("https://dolarapi.com/v1/dolares/bolsa");
  if (dollar.status === 200 && dollar?.data?.venta) {
    const isDollarLoaded = await prisma.item.findFirst({
      where: {
        date: moment.tz("America/Argentina/Buenos_Aires").toDate(),
        currency_symbol: "USD",
      },
    });
    let newDollar;
    if (!isDollarLoaded) {
      newDollar = await prisma.item.create({
        data: {
          value: dollar.data.venta,
          date: moment.tz("America/Argentina/Buenos_Aires").toDate(),
          type: "Currency",
          Currency: {
            connect: {
              symbol: "USD",
            },
          },
        },
      });
    } else {
      newDollar = await prisma.item.updateMany({
        where: {
          date: moment.tz("America/Argentina/Buenos_Aires").toDate(),
          currency_symbol: "USD",
        },
        data: {
          value: dollar.data.venta,
        },
      });
    }
    if (newDollar?.date) {
      const { value, date } = newDollar;
      return { value, date };
    } else if (newDollar?.count && newDollar.count > 0) {
      return {
        value: dollar.data.venta || 0,
        date: moment.tz("America/Argentina/Buenos_Aires").toDate(),
      };
    } else {
      throw new Error("Error fetching dollar value");
    }
  } else {
    throw new Error("Error fetching dollar value");
  }
}

export async function fetchLastUvaValue() {
  const uva = await axios.get("https://api.estadisticasbcra.com/uva", {
    headers: {
      Authorization: "Bearer " + process.env.ESTADISTICASBCRA_TOKEN,
    },
  });
  if (uva.status === 200 && uva.data.length > 0) {
    const lastUva = uva.data[uva.data.length - 1];
    return await prisma.uva.create({
      data: {
        date: new Date(lastUva.d),
        value: lastUva.v,
      },
    });
  } else {
    throw new Error("Error fetching UVA value");
  }
}

export function fetchLastTnaValue() {}

export async function fetchLastStockValue(symbol, market = "nASDAQ") {
  const resp = await fetchSymbolPriceIOL(symbol, market);
  if (resp.price) {
    const isStockLoaded = await prisma.item.findFirst({
      where: {
        stock_symbol: symbol,
        date: new Date(),
      },
    });
    let newStock;
    if (!isStockLoaded) {
      newStock = await prisma.item.create({
        data: {
          value: resp.price,
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
    } else {
      newStock = await prisma.item.updateMany({
        where: {
          stock_symbol: symbol,
          date: new Date(),
        },
        data: {
          value: resp.price,
        },
      });
    }
    if ((newStock?.count && newStock.count > 0) || newStock?.date) {
      return { value: resp.price, date: new Date() };
    } else {
      throw new Error("Error fetching stock value");
    }
  } else {
    throw new Error("Error fetching stock value");
  }
}

export async function fetchSymbolValueOnDate(symbol, market = "nASDAQ", date) {
  const resp = await fetchSymbolPriceIOLOnDate(symbol, market, date);
  console.log(resp);
  if (resp?.price) {
    const isStockLoaded = await prisma.item.findFirst({
      where: {
        stock_symbol: symbol,
        date: moment(date, "YYYY-MM-DD").toDate(),
      },
    });
    let newStock;
    if (!isStockLoaded) {
      newStock = await prisma.item.create({
        data: {
          value: resp?.price,
          date: date,
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
    } else {
      newStock = await prisma.item.updateMany({
        where: {
          stock_symbol: symbol,
          date: moment(date, "YYYY-MM-DD").toDate(),
        },
        data: {
          value: resp.price,
        },
      });
    }
    if ((newStock?.count && newStock.count > 0) || newStock?.date) {
      return { value: resp.price, date };
    } else {
      throw new Error("Error fetching stock value");
    }
  } else {
    throw new Error("Error fetching stock value");
  }
}

export async function generateMockDollars() {
  let date = new moment("2015-01-01");
  while (date.isBefore(moment())) {
    const randomFloatValue = (Math.random() * (1000 - 1) + 1).toFixed(2);
    const added = await prisma.item.create({
      data: {
        type: "Currency",
        date: date.toDate(),
        value: parseFloat(randomFloatValue),
        Currency: {
          connect: {
            symbol: "USD",
          },
        },
      },
    });
    if (!added) {
      throw new Error("Error generating mock dollars");
    }
    date.add(1, "days");
  }
  return true;
}

export async function generateMockMeli() {
  let date = new moment("2023-01-01");
  while (date.isBefore(moment())) {
    const randomFloatValue = (Math.random() * (1000 - 1) + 1).toFixed(2);
    const added = await prisma.item.create({
      data: {
        Organization: {
          connect: {
            symbol: "MELI",
          },
        },
        type: "Stock",
        date: date.toDate(),
        value: parseFloat(randomFloatValue),
      },
    });
    if (!added) {
      throw new Error("Error generating mock meli");
    }
    date.add(1, "days");
  }
  return true;
}
