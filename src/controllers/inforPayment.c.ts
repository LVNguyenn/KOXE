import { Request, Response } from "express";
import SalonPaymentRepository from "../repository/salonpayment";
import SalonRepository from "../repository/salon";
import UserRepository from "../repository/user";

const InforPayController = {
    create: async (req: Request, res: Response) => {
        const { type, content, fullname } = req.body;
        const userId = req.user;

        try {
            // get salon id
            const salonId = await UserRepository.getSalonIdByUserId({ userId });
            // find salon infor
            const salon = await SalonRepository.findSalonById({ salonId: salonId?.data });
            if (!salon?.data) throw new Error();
            const payRp = await SalonPaymentRepository.createMethodPay({
                type, content, fullname, salon: salon?.data
            });

            return res.json({ ...payRp });
        } catch (error) {
            return res.json({
                status: "failed",
                msg: "Error creating."
            })
        }
    },

    get: async (req: Request, res: Response) => {
        const { id }: any = req.query;
        const userId: any = req.user;

        try {
            // get salonId
            const salonRp = await UserRepository.getSalonIdByUserId({ userId });
            if (!salonRp?.data) throw new Error();
            let rs = await SalonPaymentRepository.getAllMethod({ salonId: salonRp.data, id })

            return res.json({ ...rs });
        } catch (error) {
            return res.json({
                status: "failed",
                msg: "Error getting."
            })
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const userId = req.user;
            const { id, type, content, fullname } = req.body;
            const data: any = {type, content, fullname}

            if (!userId || !id) throw new Error("Missing input.");
            // get salonId
            const salonRp = await UserRepository.getSalonIdByUserId({ userId });
            if (!salonRp.data) throw new Error("Error salonId");
            // get infor of method
            const rs = await SalonPaymentRepository.getAllMethod({ salonId: salonRp.data, id })
            if (!rs?.data[0]) throw new Error("Error find.");

            const newPay = await SalonPaymentRepository.updateMethod({...rs?.data[0], ...data});

            return res.json({ ...newPay });
        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed",
                msg: "Error update."
            })
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const userId = req.user;
            const { id } = req.params;
            if (!userId || !id) throw new Error("Missing input.");
            // get salonId
            const salonRp = await UserRepository.getSalonIdByUserId({ userId });
            if (!salonRp.data) throw new Error("Error salonId");
            // get infor of method
            const rs = await SalonPaymentRepository.getAllMethod({ salonId: salonRp.data, id })
            if (!rs?.data[0]) throw new Error("Error find.");

            const delPay = await SalonPaymentRepository.deleteMethod(rs?.data[0]);

            return res.json({ ...delPay });
        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed",
                msg: "Error delete."
            })
        }
    }
};

export default InforPayController;
