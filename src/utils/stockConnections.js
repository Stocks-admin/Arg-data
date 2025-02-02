export const stockConnection = (symbol) => ({
  Stock: {
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
  Bond: {
    Bond: {
      connectOrCreate: {
        where: {
          symbol,
        },
        create: {
          symbol,
          Country: {
            connectOrCreate: {
              where: {
                name: "Argentina",
              },
              create: {
                name: "Argentina",
              },
            },
          },
        },
      },
    },
  },
  Currency: {
    Currency: {
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
