import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Appointment, Car_User_Legals } from "../entities";

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
}

export default CarUserLegalRepository;