import { IsNull, Like, Not, getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Maintenance, Salon, Warranty } from "../entities";
import UserRepository from "./user";

const MaintenanceRepository = {

    async findMaintenanceByIdSalonId(data: any) {
        try {
            const warrantyRepository = getRepository(Maintenance);
            let warrantyDb: any = await warrantyRepository
                .createQueryBuilder('warranty')
                .innerJoinAndSelect('warranty.salon', 'salon', 'salon.salon_id = :salonId', { ...data })
                .where({ maintenance_id: data?.maintenanceId })
                .getOne()

            return FormatData("success", "find successfully!", warrantyDb);
        } catch (error) {
            return FormatData("failed", "Can not find the salon.");
        }
    }, 
}

export default MaintenanceRepository;