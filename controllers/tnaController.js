//Import prisma client
import { PrismaClient } from "@prisma/client";

//Instantiate prisma client
const prisma = new PrismaClient();

export function getLastTna() {
  return prisma.tna.findFirst({
    orderBy: {
      date: "desc",
    },
  });
}

export function getTnaOnDate(date) {
  return prisma.tna.findFirst({
    where: {
      date,
    },
  });
}

export function getTnaOnDateRange(dateStart, dateEnd) {
  return prisma.tna.findMany({
    where: {
      date: {
        gte: dateStart,
        lte: dateEnd,
      },
    },
  });
}
