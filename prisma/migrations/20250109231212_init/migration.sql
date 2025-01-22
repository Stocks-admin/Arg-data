-- CreateEnum
CREATE TYPE "ItemCurrency" AS ENUM ('ARS', 'USD');

-- CreateEnum
CREATE TYPE "ItemTypes" AS ENUM ('Stock', 'Currency', 'Bond');

-- CreateEnum
CREATE TYPE "Market" AS ENUM ('NYSE', 'NASDAQ', 'CEDEARS', 'BCBA');

-- CreateEnum
CREATE TYPE "Org_category" AS ENUM ('Metalurgica', 'Tecnologica');

-- CreateTable
CREATE TABLE "Tna" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Tna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Uva" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Uva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "type" "ItemTypes" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "market" "Market",
    "value" DOUBLE PRECISION NOT NULL,
    "price_currency" "ItemCurrency" NOT NULL DEFAULT 'USD',
    "stock_symbol" TEXT,
    "currency_symbol" TEXT,
    "bond_symbol" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "logo" TEXT,
    "market" "Market",
    "org_category" "Org_category",

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "Currency" (
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" INTEGER,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "Bond" (
    "symbol" TEXT NOT NULL,
    "batch" INTEGER DEFAULT 100,
    "countryId" INTEGER,

    CONSTRAINT "Bond_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "iol_token" (
    "token_id" SERIAL NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iol_token_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "flag" TEXT,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tna_date_key" ON "Tna"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Uva_date_key" ON "Uva"("date");

-- CreateIndex
CREATE INDEX "stock_symbol" ON "Item"("stock_symbol");

-- CreateIndex
CREATE INDEX "currency_symbol" ON "Item"("currency_symbol");

-- CreateIndex
CREATE INDEX "bond_symbol" ON "Item"("bond_symbol");

-- CreateIndex
CREATE INDEX "date" ON "Item"("date");

-- CreateIndex
CREATE UNIQUE INDEX "country_name_key" ON "country"("name");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_stock_symbol_fkey" FOREIGN KEY ("stock_symbol") REFERENCES "Organization"("symbol") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_currency_symbol_fkey" FOREIGN KEY ("currency_symbol") REFERENCES "Currency"("symbol") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_bond_symbol_fkey" FOREIGN KEY ("bond_symbol") REFERENCES "Bond"("symbol") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Currency" ADD CONSTRAINT "Currency_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bond" ADD CONSTRAINT "Bond_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
