import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Car } from "../entities";

const CarRepository = {

    async findCarByCarIdSalonId(data: any) {
        try {
            const carRepository = getRepository(Car);
            const carDb: Car = await carRepository.findOneOrFail({
                where: {car_id: data.carId},
                relations: ['salon']
            })

            if (carDb.salon?.salon_id !== data.salonId) {
                return FormatData("failed", "Error information.");
            }

            return FormatData("success", "find successfully!", carDb);
        } catch (error) {
            return FormatData("failed", "Error find the car.");
        }

    },

}

export default CarRepository;