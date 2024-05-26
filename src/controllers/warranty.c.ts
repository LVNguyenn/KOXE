import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Car, Salon, Warranty } from "../entities";
import search from "../helper/search";
import pagination from "../helper/pagination";

const warrantyController = {
    createNewWarranty: async (req: Request, res: Response) => {
        const { salonId, name, reuse, limit_kilometer, months, policy, carId } = req.body;

        try {
            const warrantyRepository = getRepository(Warranty);
            let saveWarranty = new Warranty();

            // find car by carId
            if (carId) {
                const carRepository = getRepository(Car);
                const carDb: Car = await carRepository.findOneOrFail({
                    where: { car_id: carId }
                })
                saveWarranty.car = [carDb];
            }

            // find salon by salonId
            const salonRepository = getRepository(Salon);
            saveWarranty.salon = await salonRepository.findOneOrFail({
                where: { salon_id: salonId }
            })

            // save new warranty.
            await warrantyRepository.save({ ...saveWarranty, name, reuse, limit_kilometer, months, policy });

            return res.json({
                status: "success",
                msg: "create new warranty successfully!"
            })
        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed",
                msg: "Error create new warranty."
            })
        }
    },

    getWarrantyForSalon: async (req: Request, res: Response) => {
        const { salonId, warrantyId, page, per_page, q } = req.body;

        try {
            const warrantyRepository = getRepository(Warranty);
            let warrantyDb: any = await warrantyRepository
                .createQueryBuilder('warranty')
                .innerJoinAndSelect('warranty.salon', 'salon', 'salon.salon_id = :salonId', { salonId })
                .where({ reuse: true })

            if (warrantyId)
                warrantyDb = warrantyDb
                    .where({ warranty_id: warrantyId })

            let rs = await warrantyDb.getMany();

            // search and pagination
            if (q) {
                rs = await search({ data: rs, q, fieldname: "name" })
            }

            rs = await pagination({ data: rs, page, per_page });


            return res.json({
                status: "success",
                warranties: rs?.data,
                total_page: rs?.total_page
            })
        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed",
                msg: "Error find the warranty.",
                error
            })
        }
    },

    pushWarrantyCar: async (req: Request, res: Response) => {
        const { salonId, warrantyId, carId } = req.body;

        try {
            const warrantyRepository = getRepository(Warranty);
            let warrantyDb: Warranty = await warrantyRepository.findOneOrFail({
                where: { warranty_id: warrantyId },
                relations: ['car', 'salon']
            })

            // check the warranty of the salon
            if (warrantyDb?.salon?.salon_id != salonId) {
                return res.json({
                    status: "failed",
                    msg: "error input for warranty."
                })
            }

            const carRepository = getRepository(Car);
            const carDb: Car = await carRepository.findOneOrFail({
                where: { car_id: carId }
            })

            if (warrantyDb?.car) {
                warrantyDb.car.push(carDb);

            } else {
                warrantyDb.car = [carDb];
            }

            await warrantyRepository.save(warrantyDb);

            return res.json({
                status: "success",
                msg: "pushed the warranty for car successfully!"
            })
        } catch (error) {
            return res.json({
                status: "failed",
                msg: "pushed the warranty for car failed."
            })
        }
    },

    updateWarranty: async (req: Request, res: Response) => {
        const { salonId, newWarranty } = req.body;
        const { warranty_id, create_at, salon, car, ...other } = newWarranty;

        try {
            // find warranty by salonid and warranty_id
            const warrantyRepository = getRepository(Warranty);
            let warrantyDb: any = await warrantyRepository
                .createQueryBuilder('warranty')
                .innerJoinAndSelect('warranty.salon', 'salon', 'salon.salon_id = :salonId', { salonId })
                .where({ warranty_id: warranty_id })
                .getOne()
            const rsSave = await warrantyRepository.save({ ...warrantyDb, ...other });

            return res.json({
                status: "success",
                msg: "update warranty successfully!",
                newWarranty: rsSave
            })
        } catch (error) {
            return res.json({
                status: "failed",
                msg: "update warranty error."
            })
        }

    },

    delete: async (req: Request, res: Response) => {
        const { salonId, warrantyId } = req.body;

        try {
            const warrantyRepository = getRepository(Warranty);
            let warrantyDb: any = await warrantyRepository.findOneOrFail({
                where: { warranty_id: warrantyId },
                relations: ['salon']
            })

            // check the warranty of the salon
            if (warrantyDb?.salon?.salon_id != salonId) {
                return res.json({
                    status: "failed",
                    msg: "error input for warranty."
                })
            }

            // delete
            await warrantyRepository.remove(warrantyDb);

            return res.json({
                status: "success",
                msg: "delete warranty successfully!",
                warranty: warrantyDb
            })
        } catch (error) {
            console.log(error)
            return res.json({
                status: "failed",
                msg: "Error delete warranty."
            })
        }
    },

    cancelWarranty: async (req: Request, res: Response) => {
        const { salonId, carId, warrantyId } = req.body;

        try {
            const warrantyRepository = getRepository(Warranty);
            let warrantyDb: Warranty = await warrantyRepository.findOneOrFail({
                where: { warranty_id: warrantyId },
                relations: ['salon', 'car']
            })

            // check the warranty of the salon
            if (warrantyDb?.salon?.salon_id != salonId) {
                return res.json({
                    status: "failed",
                    msg: "error input for warranty."
                })
            }

            warrantyDb.car = warrantyDb?.car.filter(car => car.car_id != carId);
            await warrantyRepository.save(warrantyDb);

            return res.json({
                status: "success",
                msg: "cancel warranty successfully!"
            })

        } catch (error) {
            return res.json({
                status: "failed",
                msg: "error cancel warranty."
            })
        }
    }

};

export default warrantyController;
