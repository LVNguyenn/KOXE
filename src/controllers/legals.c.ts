import { Request, Response } from "express";
import LegalsRepository from "../repository/legals";
import SalonRepository from "../repository/salon";
import CarRepository from "../repository/car";

const legalsController = {
    createLegalDetails: async (req: Request, res: Response) => {
        const {carId, name, salonId, reuse} = req.body;
        const salonRp = await SalonRepository.findSalonById({salonId});
        const carRp = await CarRepository.findCarByCarIdSalonId({salonId, carId});
        const legalRp = await LegalsRepository.createLegalDetails({name, salon: salonRp?.data, reuse, car: carRp?.data});

        return res.json({...legalRp});
    }

}

export default legalsController;