import { IsNull, Like, Not, getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Salon, Warranty } from "../entities";
import UserRepository from "./user";

const WarrantyRepository = {

    async findWarrantyByIdSalonId(data: any) {
        try {
            const warrantyRepository = getRepository(Warranty);
            let warrantyDb: any = await warrantyRepository
                .createQueryBuilder('warranty')
                .innerJoinAndSelect('warranty.salon', 'salon', 'salon.salon_id = :salonId', { ...data })
                .leftJoinAndSelect('warranty.maintenance', 'maintenance')
                .where({ warranty_id: data?.warrantyId })
                .getOne()

            return FormatData("success", "find successfully!", warrantyDb);
        } catch (error) {
            return FormatData("failed", "Can not find the salon.");
        }
    }, 

    async updateWarranty(data: any) {
        try {
            const warrantyRepository = getRepository(Warranty);
            let warrantyDb: any = await warrantyRepository.save({...data})

            return FormatData("success", "update successfully!", warrantyDb);
        } catch (error) {
            return FormatData("failed", "Can not update new warranty.");
        }
    }, 
}

export default WarrantyRepository;