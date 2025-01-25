import {
  ItemCurrency,
  ItemTypes,
  Market,
  PrismaClient,
  Prisma,
} from "@prisma/client";
import axios from "axios";
import iolInstance from "../utils/IOLInterceptor";

const db = new PrismaClient();

export const initializeDatabase = async () => {
  await createCurrencies();
  await fetchHistoricalDollarValue();
  await Promise.all([
    getBondsArg(),
    getCedearsArg(),
    getStocksArg(),
    getStocksUsa(),
  ]);
};

const createCurrencies = async () => {
  try {
    await db.currency.create({
      data: {
        symbol: "USD",
        name: "Dolar",
        country: {
          connectOrCreate: {
            where: { name: "Estados Unidos" },
            create: { name: "Estados Unidos" },
          },
        },
      },
    });
    await db.currency.create({
      data: {
        symbol: "ARS",
        name: "Peso Argentino",
        country: {
          connectOrCreate: {
            where: { name: "Argentina" },
            create: { name: "Argentina" },
          },
        },
      },
    });
  } catch (error) {
    console.log(error);
    throw new Error("Could not create currencies");
  }
};

const fetchHistoricalDollarValue = async () => {
  try {
    const resp = await axios.get<CurrencyDTO>(
      "https://api.argentinadatos.com/v1/cotizaciones/dolares"
    );
    const data = resp.data;
    data.map(async (item) => {
      if (item.casa == "bolsa") {
        await db.item.create({
          data: {
            type: ItemTypes.Currency,
            price_currency: ItemCurrency.ARS,
            value: item.venta,
            date: new Date(item.fecha),
            Currency: {
              connect: {
                symbol: "USD",
              },
            },
          },
        });
      }
    });
  } catch (error) {
    throw new Error("Could not fetch historical dollar value");
  }
};

const getBondsArg = async () => {
  try {
    const resp = await iolInstance.get<PriceDTO>(
      "https://api.invertironline.com/api/v2/cotizaciones/letras/argentina/todos"
    );
    const {
      data: { titulos },
    } = resp;

    await Promise.all(
      titulos.map(async (item) => {
        await db.item.create({
          data: {
            date: new Date(),
            type: ItemTypes.Bond,
            value: item.ultimoPrecio,
            price_currency:
              item.moneda === "1" ? ItemCurrency.ARS : ItemCurrency.USD,
            Bond: {
              connectOrCreate: {
                where: {
                  symbol: item.simbolo,
                },
                create: {
                  symbol: item.simbolo,
                  Country: {
                    connect: {
                      name: "Argentina",
                    },
                  },
                },
              },
            },
            market: Market.BCBA,
          },
        });
      })
    );
  } catch (error) {
    console.log(error);
    throw new Error("Could not fetch bonds from Argentina");
  }
};

const getCedearsArg = async () => {
  try {
    const resp = await iolInstance.get<PriceDTO>(
      "https://api.invertironline.com/api/v2/cotizaciones/cedears/argentina/todos"
    );
    const {
      data: { titulos },
    } = resp;
    const cedears: Array<Prisma.OrganizationCreateManyInput> = [];
    const items: Array<Prisma.ItemCreateManyInput> = [];
    titulos.forEach((item) => {
      cedears.push({
        symbol: item.simbolo,
        name: item.descripcion,
        market: Market.CEDEARS,
      });
      items.push({
        date: new Date(),
        type: ItemTypes.Stock,
        value: item.ultimoPrecio,
        price_currency: ItemCurrency.USD,
        stock_symbol: item.simbolo,
        market: Market.CEDEARS,
      });
    });

    await db.organization.createMany({
      data: cedears,
      skipDuplicates: true,
    });
    await db.item.createMany({
      data: items,
    });
  } catch (error) {
    throw new Error("Could not fetch cedears from Argentina");
  }
};

const getStocksArg = async () => {
  try {
    const resp = await iolInstance.get<PriceDTO>(
      "https://api.invertironline.com/api/v2/cotizaciones/acciones/argentina/todos"
    );
    const {
      data: { titulos },
    } = resp;
    const stocks: Array<Prisma.OrganizationCreateManyInput> = [];
    const items: Array<Prisma.ItemCreateManyInput> = [];
    titulos.forEach((item) => {
      stocks.push({
        symbol: item.simbolo,
        name: item.descripcion,
        market: Market.BCBA,
      });
      items.push({
        date: new Date(),
        type: ItemTypes.Stock,
        value: item.ultimoPrecio,
        price_currency: ItemCurrency.ARS,
        stock_symbol: item.simbolo,
        market: Market.BCBA,
      });
    });

    await db.organization.createMany({
      data: stocks,
      skipDuplicates: true,
    });
    await db.item.createMany({
      data: items,
    });
  } catch (error) {
    console.log(error);
    throw new Error("Could not fetch stocks from Argentina");
  }
};

const getStocksUsa = async () => {
  try {
    const resp = await iolInstance.get<PriceDTO>(
      "https://api.invertironline.com/api/v2/cotizaciones/acciones/estados_unidos/todos"
    );
    const {
      data: { titulos },
    } = resp;
    const stocks: Array<Prisma.OrganizationCreateManyInput> = [];
    const items: Array<Prisma.ItemCreateManyInput> = [];
    titulos.forEach((item) => {
      stocks.push({
        symbol: item.simbolo,
        name: item.descripcion,
        market: item.mercado === "3" ? Market.NASDAQ : Market.NYSE,
      });
      items.push({
        date: new Date(),
        type: ItemTypes.Stock,
        value: item.ultimoPrecio,
        price_currency: ItemCurrency.USD,
        stock_symbol: item.simbolo,
        market: item.mercado === "3" ? Market.NASDAQ : Market.NYSE,
      });
    });

    await db.organization.createMany({
      data: stocks,
      skipDuplicates: true,
    });
    await db.item.createMany({
      data: items,
    });
  } catch (error) {
    console.log(error);
    throw new Error("Could not fetch stocks from USA");
  }
};
