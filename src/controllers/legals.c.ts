import { Request, Response } from "express";
import LegalsRepository from "../repository/legals";
import SalonRepository from "../repository/salon";
import CarRepository from "../repository/car";
import UserRepository from "../repository/user";

const legalsController = {
    createProcess: async (req: Request, res: Response) => {
        const { carId, name, salonId, documents } = req.body;
        // get Salon
        const salonRp = await SalonRepository.findSalonById({ salonId });
        // get Car
        const carRp = await CarRepository.findCarByCarIdSalonId({ salonId, carId });
        //create new process
        const processRp = await LegalsRepository.createProcess({ name, car_id: carId, salon: salonRp?.data, cars: [carRp?.data] });
        // create new documents
        for (let document of documents) {
            // documents = [{name: name 1, order: 1, details:  [detail 1, detail 2, ...] }, {name: name 2, order: 2, details:  [detail 3, detail 4, ...] }, ...]
            const documentRp = await LegalsRepository.createLegalDocuments({ name: document.name, order: document.order, process: processRp?.data });
            // create new details for documents
            for (let detail of document?.details) {
                await LegalsRepository.createLegalDetails({ name: detail, document: documentRp?.data });
            }
        }

        return res.json({ status: processRp?.status, msg: processRp?.msg });
    },

    createLegalDocuments: async (req: Request, res: Response) => {
        const { name, salonId, reuse, order, processId, details } = req.body;
        // get salon
        const salonRp = await SalonRepository.findSalonById({ salonId });
        // get process
        const processRp = await LegalsRepository.findProcessByIdSalonId({ processId, salonId });
        // create new documents
        const documentRp = await LegalsRepository.createLegalDocuments({ name, order, salon: salonRp?.data, reuse, process: processRp?.data });
        // create new details for documents
        for (let detail of details) {
            await LegalsRepository.createLegalDetails({ name: detail, document: documentRp?.data });
        }

        return res.json({ ...documentRp });
    },

    createLegalDetails: async (req: Request, res: Response) => {
        const { period, salonId, details } = req.body;
        let detailRp;
        // get documents by period
        const documentRp = await LegalsRepository.findLegalDocumentSalonId({ salonId, period });

        if (!documentRp?.data) {
            return res.json({
                status: documentRp?.status,
                msg: documentRp?.msg
            })
        }

        try {
            // create all details for the documents
            for (let detail of details) {
                detailRp = await LegalsRepository.createLegalDetails({ name: detail, document: documentRp.data[0] });
            }
        } catch (error) { }


        return res.json({ ...detailRp });
    },

    getAllProcess: async (req: Request, res: Response) => {
        const { salonId } = req.body;
        const legalRp = await LegalsRepository.getAllProcessBySalonId({ salonId })

        return res.json({ ...legalRp });
    },

    updateProcess: async (req: Request, res: Response) => {
        const { salonId, processId, name } = req.body;
        const processRp = await LegalsRepository.updateProcessById({ salonId, processId, name })

        return res.json({ ...processRp });
    },

    updateLegalDocuments: async (req: Request, res: Response) => {
        const { salonId, period, name, reuse } = req.body;
        const legalRp = await LegalsRepository.updateLegalDocuments({ salonId, period, name, reuse })

        return res.json({ ...legalRp });
    },

    updateLegalDetailsOfDocuments: async (req: Request, res: Response) => {
        const { id, salonId, period, name } = req.body;
        const legalRp = await LegalsRepository.updateLegalDetailsOfDocuments({ id, salonId, period, name })

        return res.json({ ...legalRp });
    },

    removeProcess: async (req: Request, res: Response) => {
        const { processId, salonId } = req.body;
        const legalRp = await LegalsRepository.removeProcess({ processId, salonId })

        return res.json({ ...legalRp });
    },

    removeLegalDetailsForDocuments: async (req: Request, res: Response) => {
        const { id, salonId, period } = req.body;
        const legalRp = await LegalsRepository.removeLegalDetails({ id, salonId, period })

        return res.json({ ...legalRp });
    },



    removeLegalDocuments: async (req: Request, res: Response) => {
        const { salonId, period } = req.body;
        const legalRp = await LegalsRepository.removeLegalDocuments({ salonId, period })

        return res.json({ ...legalRp });
    },

    addLegalForUser: async (req: Request, res: Response) => {
        const { salonId, phone, carId, details, period } = req.body;
        // details = [id detail 1, id 2, ...]
        const carRp = await CarRepository.findCarByCarIdSalonId({carId, salonId});

        if (!carRp?.data) {
            return res.json({
                status: "failed",
                msg: "Error add legals for the user."
            })
        }

        const userRp = await LegalsRepository.addLegalForUser({phone, car_id: carId});

        return res.json({...userRp});
    },

    addLegalDetailsForUser: async (req: Request, res: Response) => {
        const { salonId, phone, details, period } = req.body;
        let data: any = {};

        if (!phone) {
            return res.json({
                status: "failed",
                msg: "Phone must be not null."
            })
        }

        // find legal car user
        const carUserRp = await LegalsRepository.findLegalUserByPhone({phone});
        console.log(carUserRp)

        // details = [id detail 1, id 2, ...]
        // find details
        for (let detail of details) {
            const detailRp = await LegalsRepository.findLegalDetailsByPeriodSalonId({period, salonId, id: detail})
            
            if (detailRp?.data) {
                data.details = !data?.details ? [detailRp?.data] : [...data.details, detailRp?.data];
            }
        }

        const userRp = await LegalsRepository.addLegalForUser({...carUserRp?.data, details : data?.details});

        return res.json({...userRp});
    },

    getLegalsByPhoneCarId: async (req: Request, res: Response) => {
        const { salonId, phone, carId } = req.body;
        const carUserRp = await LegalsRepository.findLegalUserByPhone({carId, phone});

        return res.json({...carUserRp});
        
    },

}

export default legalsController;