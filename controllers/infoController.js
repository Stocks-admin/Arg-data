import axios from "axios";
import { PrismaClient } from "@prisma/client";
import {
  fetchSymbolPriceIOL,
  fetchSymbolPriceIOLOnDate,
} from "../helpers/iolHelper.js";
import moment from "moment-timezone";
import { getLastDollarValue } from "./dollarController.js";

//Instantiate prisma client
const prisma = new PrismaClient();

export async function fetchLastDolarValue() {
  const dollar = await axios.get("https://dolarapi.com/v1/dolares/bolsa");
  if (dollar.status === 200 && dollar?.data?.venta) {
    const isDollarLoaded = await prisma.item.findFirst({
      where: {
        date: moment().toDate(),
        currency_symbol: "USD",
      },
    });
    let newDollar;
    if (!isDollarLoaded) {
      newDollar = await prisma.item.create({
        data: {
          value: dollar.data.venta,
          date: moment().toDate(),
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
          date: moment().toDate(),
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
        date: moment().toDate(),
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

export async function loadAllSymbols(
  country = "estados_unidos",
  instrumento = "acciones"
) {
  const market = country === "estados_unidos" ? "NASDAQ" : "BCBA";
  // const market = "CEDEARS";

  try {
    const dollar = await getLastDollarValue();
    const symbols = await axios.get(
      `https://api.invertironline.com/api/v2/Cotizaciones/${instrumento}/${country}/Todos`,
      {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCJ9.eyJzdWIiOiIxNzEyMjMzIiwiSUQiOiIxNzEyMjMzIiwianRpIjoiNGY3NTI0MzAtNTZhZS00YmM1LTliOWQtMjE2ZTY3MTM5MmEzIiwiY29uc3VtZXJfdHlwZSI6IjEiLCJ0aWVuZV9jdWVudGEiOiJUcnVlIiwidGllbmVfcHJvZHVjdG9fYnVyc2F0aWwiOiJUcnVlIiwidGllbmVfcHJvZHVjdG9fYXBpIjoiVHJ1ZSIsInRpZW5lX1R5QyI6IlRydWUiLCJuYmYiOjE3MDM4MjA3MTcsImV4cCI6MTcwMzgyMTYxNywiaWF0IjoxNzAzODIwNzE3LCJpc3MiOiJJT0xPYXV0aFNlcnZlciIsImF1ZCI6IklPTE9hdXRoU2VydmVyIn0.af8NaHQkCuGZg4_VD6N3AGqYq4gYVIu2k-1fBvHQ_AUGmR8K3WfcaBm3fD8aIY2XbZqoEhSl9y7jGALwS_vDxIq9diVRvjJ7cySiGy0rPtzmQ1uXAJ47ke30DRwGcDl1GQM8cwY2OQ1ymorvrSZ1LE8GAMdKNQ1F31fFjIj9HP4UWmP63bMT5FDTyM619MkfijeqmiBvLFpRhCH-Lpgv39zK0TquxBYvw1mOxfeDkFrj3pkStNW7Ao4Ej5l3NbxWHkT4F4Ayop-7v5fwQLDr8egahwCk9DCH4gdbpTLnFoaLZ1kdMDxPxBIuDUVKxUg6Q6UxL3kOgMu6LQSfxxzgcA`,
        },
      }
    );

    const parsedSymbols = symbols.data.titulos.map((symbol) => {
      return {
        symbol: symbol.simbolo,
        country,
        // name: symbol.descripcion,
        // market,
      };
    });

    const organizations = await prisma.bond.createMany({
      data: parsedSymbols,
      skipDuplicates: true,
    });

    if (organizations) {
      const parsedItems = symbols.data.titulos.map((symbol) => {
        const value =
          symbol.moneda === "1"
            ? symbol.ultimoPrecio / dollar.value
            : symbol.ultimoPrecio;
        return {
          bond_symbol: symbol.simbolo,
          type: "Bond",
          date: new Date(),
          value,
          // market: market,
        };
      });
      return await prisma.item.createMany({
        data: parsedItems,
        skipDuplicates: true,
      });
    } else {
      throw new Error("Error loading symbols");
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error loading symbols");
  }
}
