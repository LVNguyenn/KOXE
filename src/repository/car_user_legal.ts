import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Appointment, Car, Car_User_Legals } from "../entities";

const CarUserLegalRepository = {

    async getByInvoieId(data: any) {
        try {
            const carULRepository = getRepository(Car_User_Legals);
            let carULDb = await carULRepository
            .createQueryBuilder("Car_User_Legals")
            .innerJoinAndSelect('Car_User_Legals.invoice', 'invoice','invoice.invoice_id =:invoiceId', {...data})
            .getOne();

            return FormatData("success", "update successfully!", carULDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "update failed.");
        }

    },

    async getByPhone(data: any) {
        try {
            const warrantyRepository = getRepository(Car_User_Legals);
            let warrantyDb = await warrantyRepository
            .createQueryBuilder('car_user_legals')
            .leftJoinAndMapOne(
                'car_user_legals.car',
                Car,
                'car',
                'car.car_id = car_user_legals.car_id'
            )
            .leftJoinAndSelect('car_user_legals.invoice', 'invoice')
            .where('car_user_legals.phone = :phone', { ...data })
            .getMany();

            return FormatData("success", "find successfully!", warrantyDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Can not find the salon.");
        }
    },
}

export default CarUserLegalRepository;