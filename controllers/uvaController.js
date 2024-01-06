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
      date: moment(date, "YYYY-MM-DD").toDate(),
    },
  });
  if (!uvaValue) return null;
  return {
    ...uvaValue,
    date: moment(date).tz("America/Argentina/Buenos_Aires").format(),
  };
}

export async function getUvaValueOnDateRange(dateStart, dateEnd) {
  const uvaValue = await prisma.uva.findMany({
    where: {
      date: {
        gte: moment(dateStart, "YYYY-MM-DD").toDate(),
        lte: moment(dateEnd, "YYYY-MM-DD").toDate(),
      },
    },
  });
  return uvaValue.map((uva) => ({
    ...uva,
    date: moment(uva.date).tz("America/Argentina/Buenos_Aires").format(),
  }));
}
