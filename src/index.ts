import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import router from "./routes";
import cors, { CorsOptions } from "cors";
import session from "express-session";
import { createConnection } from "typeorm";
import passport from "./config/passport";
import dotenv from "dotenv";
import { connectionString } from "./config/connect_db";
import { initAdminTeam, initPermission } from "./helper/initData";
import { app, server } from "./socket/socket";
import redis from "./config/redis";
import Cache from "./config/node-cache";

dotenv.config();
//const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY as string,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

const port: number = parseInt(process.env.PORT as string, 10) || 5000;
createConnection(connectionString)
  .then(async (connection) => {
    await initPermission("EMP", "nhân viên");
    await initPermission("SL", "salon");
    await initPermission("CAR", "xe hơi");
    await initPermission("APM", "lịch hẹn");
    await initPermission("WRT", "bảo hành");
    await initPermission("MT", "bảo dưỡng");
    await initPermission("NTF", "thông báo");
    await initAdminTeam();
    //const app = express();
    const corsOptions = {
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    };

    app.use(cors(corsOptions));
    app.use(express.static(path.join(__dirname, "public")));
    app.use(express.urlencoded({ extended: true }));

    app.use(express.json());
    app.use(cookieParser());
    app.use(
      session({
        secret: process.env.SESSION_SECRET_KEY as string,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 },
      })
    );

    // config Passport amd middleware
    app.use(passport.initialize());
    app.use(passport.session());

    // redis
    try {
      await redis.connect();
      console.log("Connected Redis.");
    } catch (error) {
      console.log("Error connection Redis.", error);
    }

    // cache
    Cache;

    router(app);
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => console.log(error));
