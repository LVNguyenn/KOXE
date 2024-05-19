import { Request, Response } from "express";
import LegalsRepository from "../repository/legals";
import SalonRepository from "../repository/salon";
import CarRepository from "../repository/car";
import UserRepository from "../repository/user";
import createNotification from "../helper/createNotification";

const legalsController = {
    createProcess: async (req: Request, res: Response) => {
        const { carId, name, salonId, documents, description, type } = req.body;
        // get Salon
        const salonRp = await SalonRepository.findSalonById({ salonId });
        // get Car
        // const carRp = await CarRepository.findCarByCarIdSalonId({ salonId, carId });
        //create new process
        // const processRp = await LegalsRepository.createProcess({ name, description, car_id: carId, salon: salonRp?.data, cars: [carRp?.data], type });
        const processRp = await LegalsRepository.createProcess({ name, description, salon: salonRp?.data, type });
        try {
            // create new documents
            for (let document of documents) {
                // documents = [{name: name 1, order: 1, details:  [detail 1, detail 2, ...] }, {name: name 2, order: 2, details:  [detail 3, detail 4, ...] }, ...]
                const documentRp = await LegalsRepository.createLegalDocuments({ name: document.name, order: document.order, process: processRp?.data });
                // create new details for documents
                for (let detail of document?.details) {
                    await LegalsRepository.createLegalDetails({ name: detail, document: documentRp?.data });
                }
            }
        } catch (error) { }


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
        try {
            // create new details for documents
            for (let detail of details) {
                await LegalsRepository.createLegalDetails({ name: detail, document: documentRp?.data });
            }
        } catch (error) { }


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
        const { salonId, processId } = req.body;
        const legalRp = await LegalsRepository.getAllProcessBySalonId({ salonId, processId })

        return res.json({ ...legalRp });
    },

    updateProcess: async (req: Request, res: Response) => {
        const { salonId, processId, name, description, type } = req.body;
        const processRp = await LegalsRepository.updateProcessById({ salonId, processId, name, description, type })

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
        const { salonId, phone, carId, invoice, processId } = data;
        const carRp = await CarRepository.findCarByCarIdSalonId({ carId, salonId });

        // get first documents for process
        const processDb = await LegalsRepository.getProcessDocumentsById({ salonId, processId })

        if (!carRp?.data) {
            return {
                status: "failed",
                msg: "Error add legals for the user."
            }
        }

        const userRp = await LegalsRepository.addLegalForUser({ phone, car_id: carId, current_period: processDb?.data?.documents[0].period, invoice, processId });

        return userRp;
    },

    addLegalDetailsForUser: async (req: Request, res: Response) => {
        const { salonId, phone, details, carId } = req.body;

        if (!phone) {
            return res.json({
                status: "failed",
                msg: "Phone must be not null."
            })
        }

        // find legal car user
        const carUserRp = await LegalsRepository.findLegalUserByPhone({ phone, carId });
        if (!carUserRp?.data[0]) {
            return res.json({ ...carUserRp });
        }
        // car by carId, salonId => To check role.
        const checkRole = await CarRepository.findCarByCarIdSalonId({ salonId, carId: carId });
        if (!checkRole?.data) {
            return res.json({ ...checkRole });
        }

        // detail = [chi tiet 1, chi tiet 2]
        // add new details.
        const userRp = await LegalsRepository.addLegalForUser({ ...carUserRp?.data[0], details: details });

        if (userRp?.data) {
            // get userId by phone
            const userDb = await UserRepository.getProfileByOther({ phone });
            // send notification
            createNotification({
                to: userDb?.data?.user_id,
                description: `${checkRole?.data?.salon.name} vừa cập nhật giấy tờ mới cho bạn.`,
                types: "process",
                avatar: checkRole?.data?.salon.image,
                isUser: false
            })
        }

        return res.json({ ...userRp });
    },

    getLegalsByPhoneCarId: async (req: Request, res: Response) => {
        const { phone, carId } = req.body;
        const carUserRp = await LegalsRepository.findLegalUserByPhone({ carId, phone });

        return res.json({ ...carUserRp });

    },

    updateNewPeriodForUser: async (req: Request, res: Response) => {
        const { phone, carId, newPeriod, salonId } = req.body;
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
        // update new period for user
        newCarUserRp = await LegalsRepository.addLegalForUser({ ...oldPeriod?.data, current_period: newPeriod });

        if (!newCarUserRp?.data) {
            return res.json({
                status: "failed",
                msg: "Error update period for user"
            })
        }

        // get userId by phone
        const userRp = await UserRepository.getProfileByOther({ phone });
        // get salon by salonId
        const salonRp = await SalonRepository.findSalonById({salonId});
        // send notification
        createNotification({
            to: userRp?.data?.user_id,
            description: `${salonRp?.data?.name} vừa cập nhật giai đoạn mới cho bạn.`,
            types: "process",
            avatar: salonRp?.data?.image,
            isUser: false
        })

        return res.json({
            status: "success",
            msg: "update new period for the user successfully!"
        })
    },

}

export default legalsController;