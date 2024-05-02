import { getRepository } from "typeorm";
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
}

export default SalonRepository;