import {
  fetchLastDolarValue,
  fetchLastUvaValue,
  updateArgentinaStockPrices,
  updateBondPrices,
  updateCedearsPrice,
  updateNasdaqStockPrices,
} from "./controllers/infoController.js";

export function fetchAllData() {
  let errors = [];

  //FETCH UVA
  fetchLastUvaValue()
    .then(() => {
      console.log("UVA value fetched");
    })
    .catch(() => {
      errors.push("UVA");
    });

  //FETCH DOLAR
  fetchLastDolarValue()
    .then(() => {
      console.log("Dolar value fetched");
    })
    .catch(() => {
      errors.push("Dolar");
    });

  //FETCH BONDS
  updateBondPrices()
    .then(() => {
      console.log("Bonds updated");
    })
    .catch(() => {
      errors.push("Bonds");
    });

  //FETCH STOCKS
  updateCedearsPrice()
    .then(() => {
      console.log("Cedears updated");
    })
    .catch(() => {
      errors.push("Cedears");
    });

  updateNasdaqStockPrices()
    .then(() => {
      console.log("Nasdaq stocks updated");
    })
    .catch(() => {
      errors.push("Nasdaq stocks");
    });

  updateArgentinaStockPrices()
    .then(() => {
      console.log("Argentina stocks updated");
    })
    .catch(() => {
      errors.push("Argentina stocks");
    });

  if (errors.length > 0) {
    console.log(`Errors found: ${errors}`);
  }

  return errors;
}
