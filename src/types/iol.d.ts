type PriceDTO = {
  titulos: Array<StockPrice>;
};

type CurrencyDTO = Array<Currency>;

type Currency = {
  venta: number;
  fecha: string;
  casa: string;
};

type StockPrice = {
  simbolo: string;
  ultimoPrecio: number;
  fecha: string;
  mercado: string;
  moneda: string;
  descripcion: string;
  lote: number;
};
