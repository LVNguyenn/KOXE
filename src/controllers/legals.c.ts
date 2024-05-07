import { Request, Response } from "express";
import LegalsRepository from "../repository/legals";
import SalonRepository from "../repository/salon";
import CarRepository from "../repository/car";
import UserRepository from "../repository/user";

const legalsController = {
    createProcess: async (req: Request, res: Response) => {
        const {carId, name, salonId, documents} = req.body;
        // get Salon
        const salonRp = await SalonRepository.findSalonById({salonId});
        // get Car
        const carRp = await CarRepository.findCarByCarIdSalonId({salonId, carId});
        //create new process
        const processRp = await LegalsRepository.createProcess({name, car_id: carId, salon: salonRp?.data, cars: [carRp?.data]});
        // create new documents
        for (let document of documents) {
            // documents = [{name: name 1, order: 1, details:  [detail 1, detail 2, ...] }, {name: name 2, order: 2, details:  [detail 3, detail 4, ...] }, ...]
            const documentRp = await LegalsRepository.createLegalDocuments({ name: document.name, order: document.order, process: processRp?.data });
            // create new details for documents
            for (let detail of document?.details) {
                await LegalsRepository.createLegalDetails({name: detail, document: documentRp?.data});
            }
        }

        return res.json({status: processRp?.status, msg: processRp?.msg});
    },

    createLegalDocuments: async (req: Request, res: Response) => {
        const {name, salonId, reuse, order, processId, details} = req.body;
        // get salon
        const salonRp = await SalonRepository.findSalonById({salonId});
        // get process
        const processRp = await LegalsRepository.findProcessByIdSalonId({processId, salonId});
        // create new documents
        const documentRp = await LegalsRepository.createLegalDocuments({name, order, salon: salonRp?.data, reuse, process: processRp?.data});
        // create new details for documents
        for (let detail of details) {
            await LegalsRepository.createLegalDetails({name: detail, document: documentRp?.data});
        }

        return res.json({...documentRp});
    },

    createLegalDetails: async (req: Request, res: Response) => {
        const {period, salonId, details} = req.body;
        let detailRp;
        // get documents by period
        const documentRp = await LegalsRepository.findLegalDocumentSalonId({salonId, period});

        if (!documentRp?.data) {
            return res.json({
                status: documentRp?.status,
                msg: documentRp?.msg
            })
        }

        try {
            // create all details for the documents
            for (let detail of details) {
                detailRp = await LegalsRepository.createLegalDetails({name: detail, document: documentRp.data[0]});
            }
        } catch (error) {}


        return res.json({...detailRp});
    },

    getAllProcess: async (req: Request, res: Response) => {
        const {salonId} = req.body;
        const legalRp = await LegalsRepository.getAllProcessBySalonId({salonId})

        return res.json({...legalRp});
    },

    updateProcess: async (req: Request, res: Response) => {
        const {salonId, processId, name} = req.body;
        const processRp = await LegalsRepository.updateProcessById({salonId, processId, name})

        return res.json({...processRp});
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

    addLegalForUser: async (req: Request, res: Response) => {
        const {salonId, phone, carId} = req.body;
        let legalRp;
        const customRp = await UserRepository.getProfileByOther({phone});
        const carRp = await LegalsRepository.findLegalDocumentSalonId({carId, salonId});
        for (let legal of carRp?.data) {
            legalRp = await LegalsRepository.addLegalForUser({ user: customRp?.data, olduser: legal?.user, legal});
        }

        return res.json({
            status: legalRp?.status,
            msg: legalRp?.msg
        });
    },
}

export default legalsController;