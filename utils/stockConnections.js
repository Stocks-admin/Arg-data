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
          country: "Argentina",
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
