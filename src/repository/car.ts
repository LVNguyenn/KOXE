import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Car } from "../entities";

const CarRepository = {

    async findCarByCarIdSalonId(data: any) {
        try {
            const carRepository = getRepository(Car);
            const carDb: Car = await carRepository.findOneOrFail({
                where: {car_id: data.carId}
                // relations: ['salon']
            })

            // if (carDb.salon?.salon_id !== data.salonId) {
            //     return FormatData("failed", "Error information.");
            // }

            return FormatData("success", "find successfully!", carDb);
        } catch (error) {
            return FormatData("failed", "Error find the car.");
        }

    },

    async findLegalByCar(data: any) {
        try {
            const carRepository = getRepository(Car);
            const carDb : any = await carRepository
            .createQueryBuilder('car')
            .leftJoinAndSelect('car.legals', 'legalDocuments')
            .leftJoinAndSelect('legalDocuments.documents', 'legalDetails')
            .orderBy('legalDocuments.order', 'ASC')
            .where({
                car_id: data?.carId 
            })
            .getMany()

            return FormatData("success", "find successfully!", carDb);
        } catch (error) {
            return FormatData("failed", "Error find the legal documents.");
        }
    },

    async findLegalByCarSalonLegal(data: any) {
        try {
            const carRepository = getRepository(Car);
            const carDb : any = await carRepository
            .createQueryBuilder('car')
            .leftJoinAndSelect('car.legals', 'legalDocuments')
            .leftJoinAndSelect('legalDocuments.documents', 'legalDetails')
            .leftJoinAndSelect('legalDocuments.legals', 'legalDocuments')
            .leftJoinAndSelect('legalDocuments.salon', 'salon',  'salon.salon_id = :salonId', { ...data })
            .where({
                car_id: data?.carId 
            })
            .getOne()

            return FormatData("success", "find successfully!", carDb);
        } catch (error) {
            return FormatData("failed", "Error find the legal documents.");
        }
    },
}

export default CarRepository;