import express from "express";
import logger from "./middlewares/logger.js";
import router from "./router/router.js";
import cors from "cors";
import { connectToDb } from "./DB/dbService.js";
import chalk from "chalk";
import dotenv from "dotenv";
import serverLogger from "./middlewares/loggerService.js";
dotenv.config();
const app = express(); //איתחול אפליקציית אקספרס חדשה
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5173",
      "https://cards-front.netlify.app",
    ],
  })
);

app.use(express.json());
app.use(serverLogger);

app.use(express.static("./public"));
app.get("/ping", (req, res) => {
  res.send("pong");
});
app.use(router);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).send("Server Internal Error");
});

app.listen(port, () => {
  console.log(chalk.blueBright(`Listening on: http://localhost:${port}`));
  console.log(serverLogger);
  connectToDb();
});
