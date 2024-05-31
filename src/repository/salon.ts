import { IsNull, Like, Not, getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Salon } from "../entities";

const SalonRepository = {

    async findSalonById(data: any) {
        try {
            const salonRepository = getRepository(Salon);
            const salonDb = await salonRepository.findOneOrFail({
                where: {salon_id: data?.salonId}
            });

            return FormatData("success", "find successfully!", salonDb);
        } catch (error) {
            return FormatData("failed", "Can not find the salon.");
        }

    },

    async getAllSalon(data: any) {
        try {
            const salonRepository = getRepository(Salon);
            const salonDb = await salonRepository.find({
                where: {user_id: Not(IsNull()) }
            });

            return FormatData("success", "find successfully!", salonDb);
        } catch (error) {
            return FormatData("failed", "Can not find the salon.");
        }
    },

    async delete(data: any) {
        try {
            const salonRepository = getRepository(Salon);
            const salonDb = await salonRepository.remove(data);

            return FormatData("success", "deleted successfully!", salonDb); 
        } catch (error) {
            return FormatData("failed", "Invalid information.");
        }
    },

    async removeAndBlock(data: any) {
        try {
            const salonRepository = getRepository(Salon);
            const salonDb = await salonRepository.save({...data, user_id: null, employees: null});

            return FormatData("success", "blocked successfully!", salonDb); 
        } catch (error) {
            return FormatData("failed", "blocking failed.");
        }
    },
}

export default SalonRepository;