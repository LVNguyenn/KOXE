import { Request, Response } from "express";
import LegalsRepository from "../repository/legals";
import SalonRepository from "../repository/salon";
import CarRepository from "../repository/car";

const legalsController = {
    createLegalDocuments: async (req: Request, res: Response) => {
        const {carId, name, salonId, reuse, order} = req.body;
        const salonRp = await SalonRepository.findSalonById({salonId});
        const carRp = await CarRepository.findCarByCarIdSalonId({salonId, carId});
        const legalRp = await LegalsRepository.createLegalDocuments({name, order, salon: salonRp?.data, reuse, car: [carRp?.data]});

        return res.json({...legalRp});
    },

    createLegalDetails: async (req: Request, res: Response) => {
        const {period, name, salonId} = req.body;
        const periodDb = await LegalsRepository.findLegalDocumentSalonId({salonId, period});
        const legalRp = await LegalsRepository.createLegalDetails({name, period: periodDb?.data[0]});

        return res.json({...legalRp});
    },

    getLegalDocuments: async (req: Request, res: Response) => {
        const {carId, name, salonId, reuse, period} = req.body;
        const legalRp = await LegalsRepository.findLegalDocumentSalonId({salonId, reuse, period})

        return res.json({...legalRp});
    },

    removeLegalDetailsForDocuments: async (req: Request, res: Response) => {
        const {id, salonId, period} = req.body;
        const legalRp = await LegalsRepository.removeLegalDetailsForDocuments({id, salonId, period})

        return res.json({...legalRp});
    },

    updateLegalDetailsOfDocuments: async (req: Request, res: Response) => {
        const {id, salonId, period, name} = req.body;
        const legalRp = await LegalsRepository.updateLegalDetailsOfDocuments({id, salonId, period, name})

        return res.json({...legalRp});
    },

    updateLegalDocuments: async (req: Request, res: Response) => {
        const {salonId, period, name, reuse} = req.body;
        const legalRp = await LegalsRepository.updateLegalDocuments({salonId, period, name, reuse})

        return res.json({...legalRp});
    },

    removeLegalDocuments: async (req: Request, res: Response) => {
        const {salonId, period} = req.body;
        const legalRp = await LegalsRepository.removeLegalDocuments({salonId, period})

        return res.json({...legalRp});
    },
}

export default legalsController;