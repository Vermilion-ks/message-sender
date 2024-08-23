import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import todoRoutes from "./routes/todos.routes";
import userRoutes from "./routes/users.routes";
import picturesRoutes from "./routes/pictures.routes";
import channelsRoutes from "./routes/channels.routes";
import participantsRoutes from "./routes/participants.routes";

import * as dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
dotenv.config({ path: "../../.env" });

//dotenv.config();

const corsOptions = {
  credentials: true,
  origin: [
    "http://localhost:3000",
    "http://localhost:9084",
    "http://localhost:9085",
    "http://localhost:80",
    "https://message-sender.sashagoncharov19.tk",
  ],
};

const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Настройка пути для статических файлов
app.use(
  "/pictures",
  express.static(path.join(__dirname, "client/src/pictures"))
);

app.use(
  "/channels",
  express.static(path.join(__dirname, "client/src/channels"))
);

app.use(
  "/participants",
  express.static(path.join(__dirname, "client/src/participants"))
);

// Чтение деталей подключения из dotenv файла
export const dbConnection = process.env.DB_CONN_STRING;
export const dbName = process.env.DB_NAME;

export const servicePort = process.env.SERVICE_PORT || "8080";
export const serviceIpAddress = process.env.SERVICE_IP_ADDRESS;

// Подключение к базе данных MongoDB с использованием данных из файла .env
mongoose
  .connect(`${dbConnection}/${dbName}`, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    // Если подключение успешно, слушаем порт
    app.listen(parseInt(servicePort), () => {
      console.log(
        `App is running on: http://${serviceIpAddress}:${servicePort}`
      );
      console.log(`Listening on port ${servicePort}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

// После установления подключения, выполняем колбэк
mongoose.connection.once("open", () => {
  console.log("MongoDB database connected successfully!");
});

app.use("/profiles", todoRoutes);
app.use("/users", userRoutes);
app.use("/pictures", picturesRoutes);
app.use("/channels", channelsRoutes);
app.use("/participants", participantsRoutes);
app.use("/static", express.static("src/images"));

export default app;
