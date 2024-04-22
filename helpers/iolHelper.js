import { PrismaClient } from "@prisma/client";
import axios from "axios";
import moment from "moment";
import { parseMarket } from "../utils/markets.js";
import {
  getDollarValueOnDate,
  getLastDollarValue,
} from "../controllers/dollarController.js";
import iolInstance from "../utils/IOLInterceptor.js";

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
    const symbolMarket = parseMarket[mercado.toUpperCase()] || "nASDAQ";

    const resp = await iolInstance.get(
      `https://api.invertironline.com/api/v2/${symbolMarket}/Titulos/${symbol}/Cotizacion`
    );
    const lote = resp?.data?.lote || 1;
    if (resp?.data?.moneda === "peso_Argentino" && resp?.data?.ultimoPrecio) {
      const { value: dollar } = await getLastDollarValue();
      return { price: resp?.data?.ultimoPrecio / dollar / lote };
    } else if (!isNaN(resp?.data?.ultimoPrecio)) {
      return { price: resp?.data?.ultimoPrecio / lote };
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
  try {
    const symbolMarket = parseMarket[market.toUpperCase()] || "nASDAQ";

    let dateToSearch = date;
    //If is today, we need to search for yesterday
    if (
      moment(date).tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD") ===
      moment().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD")
    ) {
      dateToSearch = moment(date).subtract(1, "day").format("YYYY-MM-DD");
    }
    if (
      moment(dateToSearch).tz("America/Argentina/Buenos_Aires").weekday() === 6
    ) {
      dateToSearch = moment(date).weekday(5).format("YYYY-MM-DD");
    }
    if (
      moment(dateToSearch).tz("America/Argentina/Buenos_Aires").weekday() === 0
    ) {
      dateToSearch = moment(date)
        .tz("America/Argentina/Buenos_Aires")
        .subtract(1, "day")
        .weekday(5)
        .format("YYYY-MM-DD");
    }

    const resp = await iolInstance.get(
      `https://api.invertironline.com/api/v2/${symbolMarket}/Titulos/${symbol}/Cotizacion/seriehistorica/${moment(
        dateToSearch
      ).format("YYYY-MM-DD")}/${moment(dateToSearch)
        .add(1, "day")
        .format("YYYY-MM-DD")}/sinAjustar`
    );
    if (resp.data.length > 0 && resp.data[0].ultimoPrecio) {
      if (resp.data[0].moneda === "peso_Argentino") {
        const { value: dollar } = await getDollarValueOnDate(date);
        return { price: resp.data[0].ultimoPrecio / dollar };
      } else {
        return { price: resp.data[0].ultimoPrecio };
      }
    } else {
      throw new Error("No se encontró precio");
    }
  } catch (error) {
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
    const resp = await iolInstance.get(
      `https://api.invertironline.com/api/v2/${market}/Titulos/${symbol}/Cotizacion/seriehistorica/${moment(
        dateStart
      ).format("YYYY-MM-DD")}/${moment(dateEnd).format("YYYY-MM-DD")}`
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
