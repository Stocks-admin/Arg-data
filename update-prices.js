import { PrismaClient } from "@prisma/client";

console.log("Updating prices");
const args = process.argv.slice(2);
console.log(args);
const prisma = new PrismaClient();
const resp = await prisma.bond.upsert({
  where: {
    symbol: "TEST",
  },
  create: {
    symbol: "TEST",
    country: "TEST",
  },
  update: {
    symbol: "TEST",
    country: "TEST",
  },
});
console.log(resp);

// Función para obtener el valor de un parámetro
function getParamValue(paramName) {
  const index = args.indexOf(`--${paramName}`);
  return index !== -1 ? args[index + 1] : null;
}

// Obtener los valores de los parámetros
const param1Value = getParamValue("param1");
const param2Value = getParamValue("param2");

// Hacer algo con los valores de los parámetros
console.log("Valor de param1:", param1Value);
console.log("Valor de param2:", param2Value);
