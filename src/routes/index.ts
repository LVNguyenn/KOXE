import { Express } from 'express';
import authRouter from './auth.r';
import userRouter from './user.r';
import featureRouter from './feature.r';
import packageRouter from './package.r';
import carRouter from './car.r';
import salonRouter from './salon.r';
import apidocRouter from './apidoc.r';
import paymentRouter from './payment.r';
import purchaseRouter from './purchase';
import messageRouter from './message.r';
import appointmentRouter from './appointment.r';
import notificationRouter from './notification.r';

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
}

export default router;

