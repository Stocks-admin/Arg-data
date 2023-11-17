//Import prisma client
import { PrismaClient } from "@prisma/client";
import moment from "moment";

//Instantiate prisma client
const prisma = new PrismaClient();

export function getLastUvaValue() {
  return prisma.Uva.findFirst({
    orderBy: {
      date: "desc",
    },
  });
}

export function getUvaValueOnDate(date) {
  return prisma.Uva.findFirst({
    where: {
      date: moment(date, "DD-MM-YYYY").toDate(),
    },
  });
}

export function getUvaValueOnDateRange(dateStart, dateEnd) {
  return prisma.Uva.findMany({
    where: {
      date: {
        gte: moment(dateStart, "DD-MM-YYYY").toDate(),
        lte: moment(dateEnd, "DD-MM-YYYY").toDate(),
      },
    },
  });
}
