//Import prisma client
import { PrismaClient } from "@prisma/client";
import moment from "moment";

//Instantiate prisma client
const prisma = new PrismaClient();

export async function getLastUvaValue() {
  const uvaValue = await prisma.uva.findFirst({
    orderBy: {
      date: "desc",
    },
  });

  return {
    ...uvaValue,
    date: moment(uvaValue.date).tz("America/Argentina/Buenos_Aires").format(),
  };
}

export async function getUvaValueOnDate(date) {
  const uvaValue = await prisma.uva.findFirst({
    where: {
      date: moment(date, "DD-MM-YYYY").toDate(),
    },
  });
  return {
    ...uvaValue,
    date: moment(uvaValue.date).tz("America/Argentina/Buenos_Aires").format(),
  };
}

export async function getUvaValueOnDateRange(dateStart, dateEnd) {
  const uvaValue = await prisma.uva.findMany({
    where: {
      date: {
        gte: moment(dateStart, "DD-MM-YYYY").toDate(),
        lte: moment(dateEnd, "DD-MM-YYYY").toDate(),
      },
    },
  });
  return uvaValue.map((uva) => ({
    ...uva,
    date: moment(uva.date).tz("America/Argentina/Buenos_Aires").format(),
  }));
}
