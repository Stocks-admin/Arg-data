import axios from "axios";
import { PrismaClient, ItemTypes } from "@prisma/client";
import {
  fetchSymbolPriceIOL,
  fetchSymbolPriceIOLOnDate,
  loginToIOL,
} from "../helpers/iolHelper.js";
import moment from "moment-timezone";
import { getLastDollarValue } from "./dollarController.js";

//Instantiate prisma client
const prisma = new PrismaClient();

export async function fetchLastDolarValue() {
  try {
    const dollar = await axios.get("https://dolarapi.com/v1/dolares/bolsa");
    if (dollar?.data?.venta) {
      const dolarExists = await prisma.item.findFirst({
        where: {
          currency_symbol: "USD",
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

      let newDollar;

      if (!dolarExists) {
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
        newDollar = await prisma.item.update({
          where: {
            id: dolarExists.id,
          },
          data: {
            date: moment.tz("America/Argentina/Buenos_Aires").toDate(),
            value: dollar.data.venta,
          },
        });
      }

      return {
        value: dollar.data.venta,
        date: moment.tz("America/Argentina/Buenos_Aires").format(),
      };
    } else {
      throw new Error("Error fetching dollar value");
    }
  } catch (error) {
    console.log(error);
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
  if (!isNaN(resp?.price)) {
    const isStockLoaded = await prisma.item.findFirst({
      where: {
        stock_symbol: symbol,
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
        data: {
          value: resp.price,
          date: moment.tz("America/Argentina/Buenos_Aires").toDate(),
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
  try {
    const resp = await fetchSymbolPriceIOLOnDate(symbol, market, date);
    if (isNaN(resp?.price)) throw new Error("Error fetching stock value");
    let newStock = await prisma.item.create({
      data: {
        value: resp?.price,
        date: moment(date).toDate(),
        type: "Stock",
        market: market.toUpperCase(),
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

    if (newStock?.count && newStock.count > 0 && newStock?.date) {
      return { value: resp.price, date };
    } else {
      throw new Error("Error fetching stock value");
    }
  } catch (error) {
    throw new Error(error);
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

export async function updateBondPrices() {
  try {
    const { access_token: iol_token } = await loginToIOL();

    const databaseBonds = await prisma.item.findMany({
      where: {
        type: "Bond",
        date: {
          gte: moment()
            .tz("America/Argentina/Buenos_Aires")
            .startOf("day")
            .toDate(),
          lte: moment()
            .tz("America/Argentina/Buenos_Aires")
            .endOf("day")
            .toDate(),
        },
      },
    });
    if (databaseBonds.length <= 0) return 1;
    const bonds = await axios.get(
      "https://api.invertironline.com/api/v2/Cotizaciones/titulosPublicos/argentina/Todos",
      {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${iol_token}`,
        },
      }
    );
    if (bonds.status !== 200 || bonds.data.length <= 0)
      throw new Error("Error fetching bonds");

    const dolarValue = await getLastDollarValue();
    const activosParaActualizar = databaseBonds
      .filter((databaseBond) => {
        const activoEnAPI = bonds.data.titulos.find(
          (activo) => activo.simbolo === databaseBond.bond_symbol
        );
        return activoEnAPI !== undefined;
      })
      .map((databaseBond) => {
        const bond = bonds.data.titulos.find(
          (activo) => activo.simbolo === databaseBond.bond_symbol
        );
        const value =
          bond.moneda === "1" || bond.moneda === "peso_Argentino"
            ? bond.ultimoPrecio / dolarValue.value
            : bond.ultimoPrecio;

        const date = moment().format();

        return {
          where: { id: databaseBond.id },
          data: {
            value,
            date,
          },
        };
      });

    for (const registro of activosParaActualizar) {
      // Lógica para actualizar cada registro
      await prisma.item.update({ ...registro });
    }

    return 1;
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateCedearsPrice() {
  try {
    const { access_token: iol_token } = await loginToIOL();

    const databaseCedears = await prisma.item.findMany({
      where: {
        type: "Stock",
        market: "CEDEARS",
        date: {
          gte: moment()
            .tz("America/Argentina/Buenos_Aires")
            .startOf("day")
            .toDate(),
          lte: moment()
            .tz("America/Argentina/Buenos_Aires")
            .endOf("day")
            .toDate(),
        },
      },
    });
    if (databaseCedears.length <= 0) return 1;
    const cedears = await axios.get(
      "https://api.invertironline.com/api/v2/Cotizaciones/cedears/argentina/Todos",
      {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${iol_token}`,
        },
      }
    );

    const dolarValue = await getLastDollarValue();

    const activosParaActualizar = databaseCedears
      .filter((databaseCedear) => {
        const apiAsset = cedears.find(
          (activo) => activo.simbolo === databaseCedear.simbolo
        );
        return apiAsset !== undefined;
      })
      .map((databaseCedear) => {
        const cedear = cedears.find(
          (activo) => activo.simbolo === databaseCedear.bond_symbol
        );
        return {
          where: { id: databaseCedear.id },
          data: {
            value:
              cedear.moneda === "1" || cedear.moneda === "peso_Argentino"
                ? cedear.ultimoPrecio / dolarValue.value
                : cedear.ultimoPrecio,
            date: moment.tz("America/Argentina/Buenos_Aires").toDate(),
          },
        };
      });

    for (const registro of activosParaActualizar) {
      // Lógica para actualizar cada registro
      await prisma.item.update({ ...registro });
    }

    return 1;
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateArgentinaStockPrices() {
  try {
    const { access_token: iol_token } = await loginToIOL();

    const databaseStocks = await prisma.item.findMany({
      where: {
        type: "Stock",
        market: "BCBA",
        date: {
          gte: moment()
            .tz("America/Argentina/Buenos_Aires")
            .startOf("day")
            .toDate(),
          lte: moment()
            .tz("America/Argentina/Buenos_Aires")
            .endOf("day")
            .toDate(),
        },
      },
    });
    if (databaseStocks.length <= 0) return 1;
    const stocks = await axios.get(
      "https://api.invertironline.com/api/v2/Cotizaciones/acciones/argentina/Todos",
      {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${iol_token}`,
        },
      }
    );

    const dolarValue = await getLastDollarValue();

    const activosParaActualizar = databaseStocks
      .filter((databaseStock) => {
        const apiAsset = stocks.find(
          (activo) => activo.simbolo === databaseStock.simbolo
        );
        return apiAsset !== undefined;
      })
      .map((databaseStock) => {
        const stock = stocks.find(
          (activo) => activo.simbolo === databaseStock.bond_symbol
        );
        return {
          where: { id: databaseStock.id },
          data: {
            value:
              stock.moneda === "1" || stock.moneda === "peso_Argentino"
                ? stock.ultimoPrecio / dolarValue.value
                : stock.ultimoPrecio,
            date: moment.tz("America/Argentina/Buenos_Aires").toDate(),
          },
        };
      });

    for (const registro of activosParaActualizar) {
      // Lógica para actualizar cada registro
      await prisma.item.update({ ...registro });
    }

    return 1;
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateNasdaqStockPrices() {
  try {
    const { access_token: iol_token } = await loginToIOL();

    const databaseStocks = await prisma.item.findMany({
      where: {
        type: "Stock",
        market: "NASDAQ",
        date: {
          gte: moment()
            .tz("America/Argentina/Buenos_Aires")
            .startOf("day")
            .toDate(),
          lte: moment()
            .tz("America/Argentina/Buenos_Aires")
            .endOf("day")
            .toDate(),
        },
      },
    });
    if (databaseStocks.length <= 0) return 1;

    const stocks = await axios.get(
      "https://api.invertironline.com/api/v2/Cotizaciones/acciones/estados_unidos/Todos",
      {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${iol_token}`,
        },
      }
    );

    const dolarValue = await getLastDollarValue();

    const activosParaActualizar = databaseStocks
      .filter((databaseStock) => {
        const apiAsset = stocks.find(
          (activo) => activo.simbolo === databaseStock.simbolo
        );
        return apiAsset !== undefined;
      })
      .map((databaseStock) => {
        const stock = stocks.find(
          (activo) => activo.simbolo === databaseStock.bond_symbol
        );
        return {
          where: { id: databaseStock.id },
          data: {
            value:
              stock.moneda === "1" || stock.moneda === "peso_Argentino"
                ? stock.ultimoPrecio / dolarValue.value
                : stock.ultimoPrecio,
            date: moment.tz("America/Argentina/Buenos_Aires").toDate(),
          },
        };
      });

    for (const registro of activosParaActualizar) {
      // Lógica para actualizar cada registro
      await prisma.item.update({ ...registro });
    }

    return 1;
  } catch (error) {
    throw new Error(error);
  }
}
