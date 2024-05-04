import { Express } from "express";
import authRouter from "./auth.r";
import userRouter from "./user.r";
import featureRouter from "./feature.r";
import packageRouter from "./package.r";
import carRouter from "./car.r";
import salonRouter from "./salon.r";
import apidocRouter from "./apidoc.r";
import paymentRouter from "./payment.r";
import purchaseRouter from "./purchase.r";
import messageRouter from "./message.r";
import appointmentRouter from "./appointment.r";
import notificationRouter from "./notification.r";
import videocallRouter from "./videocall.r";
import adminRouter from "./admin";
import maintenanceRouter from "./maintenance.r";
import warrantyRouter from "./warranty.r";
import invoiceRouter from "./invoice.r";
import accessoryRouter from "./accessory.r";
import legalsRouter from "./legals.r";
import postRouter from "./post.r";
import connectionRouter from "./connection.r";
import transactionRouter from "./transaction.r";

function router(app: Express) {
  app.use("/auth", authRouter);
  app.use("/users", userRouter);
  app.use("/features", featureRouter);
  app.use("/packages", packageRouter);
  app.use("/cars", carRouter);
  app.use("/salons", salonRouter);
  app.use("/api", apidocRouter);
  app.use("/payment", paymentRouter);
  app.use("/purchase", purchaseRouter);
  app.use("/messages", messageRouter);
  app.use("/appointment", appointmentRouter);
  app.use("/notification", notificationRouter);
  app.use("/videocall", videocallRouter);
  app.use("/admin", adminRouter);
  app.use("/maintenance", maintenanceRouter);
  app.use("/warranty", warrantyRouter);
  app.use("/invoice", invoiceRouter);
  app.use("/accessory", accessoryRouter);
  app.use("/legals", legalsRouter);
  app.use("/posts", postRouter);
  app.use("/connections", connectionRouter);
  app.use("/transactions", transactionRouter);
}

export default router;
