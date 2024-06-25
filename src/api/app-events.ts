import { NextFunction, Request, Response } from "express";

import PaymentService from "../services/payment-service";

export const appEvents = (app: any) => {
    
    const service = new PaymentService();
    
    app.use('/app-events', async (req: Request, res: Response) => {
        console.log("============= Payment Service ================");
        const {payload} = req.body;

        //handle subscribe events
        const rs = await service.SubscribeEvents(payload);
        return res.status(200).json(rs);

    });

}