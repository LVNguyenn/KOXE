import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const corsOptions = {
  origin: ["http://localhost:3000", "https://fe-salon-oto.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};
app.use(cors(corsOptions )); 
app.use(express.json());

// In ra giá trị của các biến môi trường để kiểm tra
console.log('PAYMENT_SERVICE:', process.env.PAYMENT_SERVICE);
console.log('MAIN_SERVICE:', process.env.MAIN_SERVICE);

app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY as string,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

app.use("/payment", proxy(process.env.PAYMENT_SERVICE as string));
app.use("/", proxy(process.env.MAIN_SERVICE as string));
// app.use("/", (req: Request, res: Response) => {
//   res.send("Not match every api.");
// });

app.listen(5000, () => {
  console.log("Gateway is Listening to Port 5000");
});