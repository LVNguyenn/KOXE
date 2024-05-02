import { Request, Response } from "express";
import LegalsRepository from "../repository/legals";

const legalsController = {
    createLegalDetails: async (req: Request, res: Response) => {
        const {carId, name, salonId} = req.body;
        const legalRp = await LegalsRepository.createLegalDetails({name});

        return res.json({...legalRp});
    }

}

export default legalsController;