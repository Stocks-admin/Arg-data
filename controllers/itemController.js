import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function searchItem(query) {
  const items = await prisma.item.findMany({
    where: {
      OR: [
        {
          OR: [
            {
              stock_symbol: {
                contains: query.toUpperCase(),
                mode: "insensitive",
              },
            },
            {
              Organization: {
                name: {
                  contains: query.toUpperCase(),
                  mode: "insensitive",
                },
              },
            },
          ],
        },
        {
          OR: [
            {
              currency_symbol: {
                contains: query.toUpperCase(),
                mode: "insensitive",
              },
            },
            {
              Currency: {
                name: {
                  contains: query.toUpperCase(),
                  mode: "insensitive",
                },
              },
            },
          ],
        },
        {
          bond_symbol: {
            contains: query.toUpperCase(),
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      stock_symbol: true,
      bond_symbol: true,
      currency_symbol: true,
      type: true,
      market: true,
      Organization: {
        select: {
          name: true,
          logo: true,
          market: true,
        },
      },
      Currency: {
        select: {
          name: true,
        },
      },
    },
    distinct: ["stock_symbol", "bond_symbol", "currency_symbol"],
    take: 10,
    orderBy: {
      type: "desc",
    },
  });
  return items.map((item) => {
    return {
      symbol: item.stock_symbol || item.bond_symbol || item.currency_symbol,
      full_name: item?.Organization?.name || item?.Currency?.name,
      logo: item?.Organization?.logo,
      type: item.type,
      market: item.market,
    };
  });
}
