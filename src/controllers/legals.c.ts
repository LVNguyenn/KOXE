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
        const { salonId, period, name, order, details } = req.body;
        let detailRp;

        try {
            if (!period) {
                return res.json({
                    status: "failed",
                    msg: "Missing period input."
                })
            }
            // find legal document by salon id and period => the salon is owner.
            const documentRp = await LegalsRepository.findLegalDocumentSalonId({ salonId, period })

            if (!documentRp?.data) {
                return res.json({
                    status: "failed",
                    msg: "Can not update."
                })
            }
            // detele all old details
            await LegalsRepository.removeAllLegalDetails({ period });
            // details = [name 1, name 2, ...]
            // add new details
            for (let detail of details) {
                detailRp = await LegalsRepository.createLegalDetails({ name: detail, document: documentRp.data[0] })
            }
        } catch (error) { }

        // finaly update new name for documents if existed
        if (name || order) {
            const legalRp = await LegalsRepository.updateNameLegalDocuments({ salonId, period, name, order })

            return res.json({ ...legalRp });
        }


        return res.json({ ...detailRp });
    },

    removeProcess: async (req: Request, res: Response) => {
        const { processId, salonId } = req.body;
        const legalRp = await LegalsRepository.removeProcess({ processId, salonId })

        return res.json({ ...legalRp });
    },

    removeLegalDocuments: async (req: Request, res: Response) => {
        const { salonId, period } = req.body;
        const legalRp = await LegalsRepository.removeLegalDocuments({ salonId, period })

        return res.json({ ...legalRp });
    },

    addLegalForUser: async (data: any) => {
        const { salonId, phone, carId } = data;
        const carRp = await CarRepository.findCarByCarIdSalonId({ carId, salonId });

        // get first documents
        const firstDocumentRp = await LegalsRepository.getFirstDocumentsByCar(data);
        const firstPeriod = firstDocumentRp?.data.process.documents[0].period;

        if (!carRp?.data) {
            return {
                status: "failed",
                msg: "Error add legals for the user."
            }
        }

        const userRp = await LegalsRepository.addLegalForUser({ phone, car_id: carId, current_period: firstPeriod });

        return userRp;
    },

    addLegalDetailsForUser: async (req: Request, res: Response) => {
        const { salonId, phone, details } = req.body;
        let data: any = {};

        if (!phone) {
            return res.json({
                status: "failed",
                msg: "Phone must be not null."
            })
        }

        // find legal car user
        const carUserRp = await LegalsRepository.findLegalUserByPhone({ phone });

        // details = [id detail 1, id 2, ...]
        try {
            for (let detail of details) {
                const detailRp = await LegalsRepository.findLegalDetailsByPeriodId({ period: carUserRp?.period, salonId, id: detail })

                if (detailRp?.data) {
                    data.details = !data?.details ? [detailRp?.data] : [...data.details, detailRp?.data];
                }
            }
        } catch (error) { }

        const userRp = await LegalsRepository.addLegalForUser({ ...carUserRp?.data, details: data?.details });

        return res.json({ ...userRp });
    },

    getLegalsByPhoneCarId: async (req: Request, res: Response) => {
        const { phone, carId } = req.body;
        const carUserRp = await LegalsRepository.findLegalUserByPhone({ carId, phone });

        return res.json({ ...carUserRp });

    },

    updateNewPeriodForUser: async (req: Request, res: Response) => {
        const { phone, carId, newPeriod, salonId, done } = req.body;
        let newCarUserRp;
        // get to check having permission.
        const documentRp = await LegalsRepository.findLegalDocumentSalonId({ salonId, period: newPeriod });
        if (!documentRp?.data) {
            return res.json({
                status: "failed",
                msg: "Error update the period for user."
            })
        }

        // find old period
        const oldPeriod = await LegalsRepository.getPeriodCurrentByCarUser({ carId, phone });

        if (done) {
            newCarUserRp = await LegalsRepository.addLegalForUser({ ...oldPeriod?.data, current_period: newPeriod, done: done });
        } else {
            // delete all old details
            await LegalsRepository.removeAllLegalDetails({ period: oldPeriod?.data?.current_period });
            // update new period for user
            newCarUserRp = await LegalsRepository.addLegalForUser({ ...oldPeriod?.data, current_period: newPeriod });
        }

        if (!newCarUserRp?.data) {
            return res.json({
                status: "failed",
                msg: "Error next period for user"
            })
        }

        return res.json({
            status: "success",
            msg: "update new period for the user successfully!"
        })
    },

    getAllLegalsUserForSalon: async (req: Request, res: Response) => {
        const { salonId, done } = req.body;
        const carUserRp = await LegalsRepository.getAllLegalsUserForSalon({ salonId, done });

        return res.json({ ...carUserRp });
    },

}

export default legalsController;