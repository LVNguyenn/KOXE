import express from 'express';
import cors from 'cors';
import { payment, appEvents } from './api' ;
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import session from "express-session";
import HandleErrors from './utils/error-handler';

dotenv.config();

module.exports = async (app: any) => {
    const corsOptions = {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    };

    app.use(express.json());
    app.use(cors());
    app.use(express.static(__dirname + '/public'))
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cookieParser());
    app.use(cors(corsOptions));
    app.use(
        session({
            secret: process.env.SESSION_SECRET_KEY as string,
            resave: true,
            saveUninitialized: true,
            cookie: { secure: true },
        })
    );

    //Listener
    appEvents(app);

    //api
    payment(app);

    // error handle
    app.use(HandleErrors);


}