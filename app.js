import express from "express";
import bodyParser from "body-parser";
import {
  fetchLastDolarValue,
  fetchLastUvaValue,
  generateMockDollars,
  generateMockMeli,
} from "./controllers/infoController.js";
import metrics from "./routes/metricsRoutes.js";
import dollar from "./routes/dollarRoutes.js";
import stocks from "./routes/stockRoutes.js";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Origin"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define a route for the homepage
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.get("/fetch-last-values", async (req, res) => {
  const resp = await Promise.all([fetchLastDolarValue(), fetchLastUvaValue()]);
  if (resp[0] && resp[1]) {
    res.send("Values fetched successfully");
  } else {
    res.status(500).send("Error fetching values");
  }
});

app.get("/generate-mock-dollars", async (req, res) => {
  const resp = await generateMockDollars();
  const resp2 = await generateMockMeli();
  if (resp && resp2) {
    res.send("Mock dollars generated successfully");
  } else {
    res.status(500).send("Error generating mock dollars");
  }
});

app.use("/metrics", metrics);
app.use("/stocks", stocks);
app.use("/dollar", dollar);

// Start the server
app.listen(3005, () => {
  console.log("Server started on port 3005");
});
