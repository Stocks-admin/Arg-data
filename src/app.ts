import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import {
  fetchLastDolarValue,
  fetchLastUvaValue,
  generateMockDollars,
  generateMockMeli,
  loadAllSymbols,
} from "./controllers/infoController.js";
import metrics from "./routes/metricsRoutes.js";
import dollar from "./routes/dollarRoutes.js";
import stocks from "./routes/stockRoutes.js";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { updateBonds } from "./controllers/stocksController.js";
import { initializeDatabase } from "./controllers/dbController";

const app = express();

const corsOptions = {
  origin: [
    "https://development.d2jiei2auzx96a.amplifyapp.com",
    "https://production.d2jiei2auzx96a.amplifyapp.com",
    "https://butterstocks.site",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  optionsSuccessStatus: 200,
  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define a route for the homepage
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.get("/test-db", async (req, res) => {
  const prisma = new PrismaClient();
  prisma.$queryRaw`SELECT 1 + 1 AS result;`
    .then((data) => {
      res.send(data);
    })
    .catch((e) => {
      res.status(500).send(e.toString());
    });
});

app.get("/fetch-last-values", async (req, res) => {
  const resp = await Promise.all([fetchLastDolarValue(), fetchLastUvaValue()]);
  if (resp[0] && resp[1]) {
    res.send("Values fetched successfully");
  } else {
    res.status(500).send("Error fetching values");
  }
});

app.post("/initialize-database", async (req, res) => {
  try {
    await initializeDatabase();
    res.send("Database initialized successfully");
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Error initializing database");
    }
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

app.get("/generate-symbols", async (req: Request, res: Response) => {
  const { market, instrumento } = req.query;
  try {
    const resp = await loadAllSymbols(market as string, instrumento as string);
    if (resp) {
      res.send("Mock meli generated successfully");
    } else {
      res.status(500).send("Error generating mock meli");
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send(error.message);
    }
  }
});

app.get("/updateBonds", async (req, res) => {
  try {
    const resp = await updateBonds();
    if (resp) {
      res.send("Bonds updated successfully");
    } else {
      res.status(500).send("Error updating bonds");
    }
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      res.status(500).send(error.message);
    }
  }
});

app.use("/metrics", metrics);
app.use("/stocks", stocks);
app.use("/dollar", dollar);

// Start the server
app.listen(process.env.PORT || process.env.SERVER_PORT || 3005, () => {
  console.log("Server started on port 3005");
});
