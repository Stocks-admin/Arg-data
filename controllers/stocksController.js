import { PrismaClient } from "@prisma/client";
import {
  fetchLastStockValue,
  fetchSymbolValueOnDate,
} from "./infoController.js";
import { isToday } from "../helpers/dateHelpers.js";
import moment from "moment";

const prisma = new PrismaClient();

export async function getLastStockValue(symbol, market = "NASDAQ") {
  let lastStock = await prisma.item.findFirst({
    where: {
      OR: [
        {
          stock_symbol: symbol,
          market,
        },
        {
          bond_symbol: symbol,
          market,
        },
        {
          currency_symbol: symbol,
          market,
        },
      ],
    },
    include: {
      Bond: true,
      Currency: true,
      Organization: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  let dollarValue = {
    value: lastStock?.value,
    date: moment(lastStock?.date).tz("America/Argentina/Buenos_Aires").format(),
  };
  if (!lastStock || !isToday(lastStock.date)) {
    dollarValue = await fetchLastStockValue(
      symbol,
      lastStock?.market || market
    );
    if (!dollarValue) {
      throw new Error("No dollar value found");
    }
    let data = {
      type: "Stock",
      Organization: {
        connect: {
          symbol,
        },
      },
    };

    const isBond = await prisma.bond.findFirst({
      where: {
        symbol,
      },
    });
    if (isBond) {
      data = {
        type: "Bond",
        Bond: {
          connect: {
            symbol,
          },
        },
      };
    }

    const isCurrency = await prisma.currency.findFirst({
      where: {
        symbol,
      },
    });
    if (isCurrency) {
      data = {
        type: "Currency",
        Currency: {
          connect: {
            symbol,
          },
        },
      };
    }

    lastStock = await prisma.item.create({
      data: {
        value: dollarValue.value,
        date: moment().toDate(),
        market,
        ...data,
      },
    });
  }
  return {
    value: dollarValue.value,
    date: moment(lastStock.date).tz("America/Argentina/Buenos_Aires").format(),
    type: lastStock.type,
    organization: lastStock.Organization,
    bond: lastStock.Bond,
    currency: lastStock.Currency,
    symbol:
      lastStock.stock_symbol ||
      lastStock.bond_symbol ||
      lastStock.currency_symbol,
  };
}

export async function getCurrentMultiStockValue(symbols, markets) {
  try {
    const stocksValue = await Promise.all(
      symbols.map(async (symbol, index) => {
        try {
          return await getLastStockValue(symbol, markets[index]);
        } catch (error) {
          console.error(error);
          return {};
        }
      })
    );
    return stocksValue;
  } catch (error) {
    throw new Error(error.message || "Error fetching symbol value");
  }
}

export async function getStockValueOnDate(symbol, market = "NASDAQ", date) {
  try {
    let symbolValue = await prisma.item.findFirst({
      where: {
        OR: [
          {
            stock_symbol: symbol,
            market,
          },
          {
            bond_symbol: symbol,
            market,
          },
          {
            currency_symbol: symbol,
            market,
          },
        ],
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

    if (!symbolValue) {
      try {
        const item = await prisma.item.findFirst({
          where: {
            OR: [
              {
                stock_symbol: symbol,
                market,
              },
              {
                bond_symbol: symbol,
                market,
              },
              {
                currency_symbol: symbol,
                market,
              },
            ],
          },
        });

        const type = item.type;

        const symbolOnDate = await fetchSymbolValueOnDate(
          symbol,
          market,
          type,
          date
        );
        if (symbolOnDate) {
          symbolValue = {
            value: symbolOnDate.value,
            date: moment(symbolOnDate.date)
              .tz("America/Argentina/Buenos_Aires")
              .format(),
            type,
          };
        }
      } catch (error) {
        const nearestValue = await prisma.item.findFirst({
          where: {
            OR: [
              {
                stock_symbol: symbol,
                market,
              },
              {
                bond_symbol: symbol,
                market,
              },
              {
                currency_symbol: symbol,
                market,
              },
            ],
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
          type: nearestValue.type,
        };
      }
    }

    return symbolValue;
  } catch (error) {
    throw new Error(error.message || "Error fetching symbol value");
  }
}

export async function getStockValueOnDateRange(
  symbol,
  market = "nASDAQ",
  dateStart,
  dateEnd = moment().format()
) {
  const stocksValue = await prisma.item.findMany({
    where: {
      OR: [
        {
          stock_symbol: symbol,
          market,
        },
        {
          bond_symbol: symbol,
          market,
        },
        {
          currency_symbol: symbol,
          market,
        },
      ],
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
      OR: [
        {
          stock_symbol: symbol,
        },
        {
          bond_symbol: symbol,
        },
        {
          currency_symbol: symbol,
        },
      ],
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
    throw new Error(error);
  }
}

export async function updateBonds() {
  try {
    // Obtener todos los items que sean bonos
    const bonos = await prisma.item.findMany({
      where: {
        type: "Bond", // Asumiendo que 'Bono' es el valor correcto para identificar bonos
      },
    });

    // Actualizar cada bono dividiendo el precio por 100
    for (const bono of bonos) {
      await prisma.item.update({
        where: { id: bono.id },
        data: {
          value: bono.value / 100,
        },
      });
    }

    console.log("Actualización exitosa.");
    return true;
  } catch (error) {
    console.error("Error al actualizar bonos:", error);
  }
}
