import { PrismaClient } from "@prisma/client";
import axios from "axios";
import moment from "moment";
import { parseMarket } from "../utils/markets.js";
import { getLastDollarValue } from "../controllers/dollarController.js";

const db = new PrismaClient();

export async function loginToIOL() {
  const logIn = await axios.post(
    "https://api.invertironline.com/token",
    {
      username: process.env.IOL_USERNAME,
      password: process.env.IOL_PASSWORD,
      grant_type: "password",
    },
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  if (logIn.status !== 200) throw new Error("Error al loguearse en IOL");
  await db.iol_token.upsert({
    where: {
      token_id: 1,
    },
    create: {
      token_id: 1,
      access_token: logIn.data.access_token,
      refresh_token: logIn.data.refresh_token,
      expires_at: moment().add(logIn.data.expires_in, "seconds").toDate(),
    },
    update: {
      access_token: logIn.data.access_token,
      refresh_token: logIn.data.refresh_token,
      expires_at: moment().add(logIn.data.expires_in, "seconds").toDate(),
    },
  });

  return {
    access_token: logIn.data.access_token,
    refresh_token: logIn.data.refresh_token,
  };
}

export const refreshIOL = async () => {
  const token = await db.iol_token.findUnique({
    where: {
      token_id: 1,
    },
  });
  if (!token) throw new Error("No se encontró token de IOL");
  const { refresh_token } = token;
  const newRefresh = await axios.post("https://api.invertironline.com/token", {
    refresh_token,
    grant_type: "refresh_token",
  });

  if (newRefresh.status !== 200) throw new Error("Error al refrescar token");
  await db.iol_token.update({
    where: {
      token_id: 1,
    },
    data: {
      access_token: newRefresh.data.access_token,
      refresh_token: newRefresh.data.refresh_token,
      expires_at: moment().add(newRefresh.data.expires_in, "seconds").toDate(),
    },
  });

  return {
    access_token: newRefresh.data.access_token,
    refresh_token: newRefresh.data.refresh_token,
  };
};

export const fetchSymbolPriceIOL = async (symbol, mercado = "nASDAQ") => {
  try {
    let access_token, expires_at;
    const currentToken = await db.iol_token.findUnique({
      where: {
        token_id: 1,
      },
    });

    if (!currentToken?.access_token || !currentToken?.expires_at) {
      const data = await loginToIOL();
      access_token = data.access_token;
      expires_at = data.expires_at;
    } else {
      access_token = currentToken.access_token;
      expires_at = currentToken.expires_at;
    }

    if (moment().isAfter(moment(expires_at)))
      access_token = (await loginToIOL()).access_token;

    const symbolMarket = parseMarket[mercado.toUpperCase()] || "nASDAQ";

    const resp = await axios.get(
      `https://api.invertironline.com/api/v2/${symbolMarket}/Titulos/${symbol}/Cotizacion`,
      {
        headers: {
          Authorization: `bearer ${access_token}`,
        },
      }
    );
    if (resp?.data?.moneda === "peso_argentino" && resp?.data?.ultimoPrecio) {
      const { value: dollar } = await getLastDollarValue();
      return { price: resp?.data?.ultimoPrecio / dollar };
    } else if (resp?.data?.ultimoPrecio) {
      return { price: resp?.data?.ultimoPrecio };
    } else {
      throw new Error("No se encontró precio");
    }
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export async function fetchSymbolPriceIOLOnDate(
  symbol,
  market = "nASDAQ",
  date
) {
  const symbolMarket = parseMarket[market.toUpperCase()] || "nASDAQ";
  try {
    let access_token, expires_at;
    const currentToken = await db.iol_token.findUnique({
      where: {
        token_id: 1,
      },
    });

    if (!currentToken?.access_token || !currentToken?.expires_at) {
      const data = await loginToIOL();
      access_token = data.access_token;
      expires_at = data.expires_at;
    } else {
      access_token = currentToken.access_token;
      expires_at = currentToken.expires_at;
    }

    if (moment().isAfter(moment(expires_at)))
      access_token = (await loginToIOL()).access_token;

    console.log("date", date);

    const resp = await axios.get(
      `https://api.invertironline.com/api/v2/${symbolMarket}/Titulos/${symbol}/Cotizacion/seriehistorica/${moment(
        date
      ).format("YYYY-MM-DD")}/${moment(date)
        .add(1, "day")
        .format("YYYY-MM-DD")}/sinAjustar`,
      {
        headers: {
          Authorization: `bearer ${access_token}`,
        },
      }
    );
    console.log(resp.data);
    if (resp.data.length > 0 && resp.data[0].ultimoPrecio) {
      await db.item.create({
        data: {
          value: resp.data[0].ultimoPrecio || 0,
          date: new Date(date),
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
      return { price: resp.data[0].ultimoPrecio || 0 };
    } else {
      throw new Error("No se encontró precio");
    }
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

export async function fetchSymbolPriceIOLOnDateRange(
  symbol,
  market = "nASDAQ",
  dateStart,
  dateEnd
) {
  try {
    let access_token, expires_at;
    const currentToken = await db.iol_token.findUnique({
      where: {
        token_id: 1,
      },
    });

    if (!currentToken?.access_token || !currentToken?.expires_at) {
      const data = await loginToIOL();
      access_token = data.access_token;
      expires_at = data.expires_at;
    } else {
      access_token = currentToken.access_token;
      expires_at = currentToken.expires_at;
    }

    if (moment().isAfter(moment(expires_at)))
      access_token = (await loginToIOL()).access_token;

    const resp = await axios.get(
      `https://api.invertironline.com/api/v2/${market}/Titulos/${symbol}/Cotizacion/seriehistorica/${moment(
        dateStart
      ).format("YYYY-MM-DD")}/${moment(dateEnd).format("YYYY-MM-DD")}`,
      {
        headers: {
          Authorization: `bearer ${access_token}`,
        },
      }
    );
    if (resp.data.length > 0) {
      const data = resp.data.map((item) => ({
        value: item.ultimoPrecio || 0,
        date: new Date(item.fecha),
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
      }));
      await db.item.createMany({
        data,
      });
      return data;
    }
  } catch (error) {
    throw new Error(error);
  }
}
