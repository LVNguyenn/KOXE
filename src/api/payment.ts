import { Request, Response, NextFunction } from 'express';
import PaymentService from "../services/payment-service";
import middlewareController from './middlewares/middleware';
// import { PublishAuthEvent } from '../utils';
import dotenv from 'dotenv';
import { Purchase } from '../database/models';

dotenv.config();

export const payment = (app: any) => {
    const service = new PaymentService();

    app.get("/test/", async (req: Request, res: Response) => {
        const date = new Purchase();

        return res.json(date)
    })

    app.post("/create_payment_url/", middlewareController.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
        const userId: any = req.headers['userId'] || "";
        const {package_id, months} = req.body;
        
        try {
            const data  = await service.createPaymentUrl({ userId, packageId: package_id, months });

            if (data.url) {
                return res.redirect(data.url);
            }

            return res.json(data);
        } catch (err: any) {
            next(err);
        }
    });

    app.get("/vnpay_ipn/", async (req: Request, res: Response, next: NextFunction) => {
        const userId: any = req.headers['userId'] || "";
        
        
        try {
            const data  = await service.vnpayIPN({ userId });

            return res.json(data);
        } catch (err: any) {
            next(err);
        }
    });

    app.get("/vnpay_return/", async (req: Request, res: Response, next: NextFunction) => {
        
        try {
            const data  = await service.vnpayReturn(req.query);

            // return res.json(data);
            return res.redirect(data?.url);
        } catch (err: any) {
            next(err);
        }
    });

}