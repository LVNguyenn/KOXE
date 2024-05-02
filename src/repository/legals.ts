import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { LegalDetails } from "../entities";


const LegalsRepository = {

    async createLegalDetails(data: any) {
        try {
            const legalsRepository = getRepository(LegalDetails);
            await legalsRepository.save(data);

            return FormatData("success", "create legal details successfully!", data);
        } catch (error) {
            return FormatData("success", "Error create new legals.");
        }

    },

}

export default LegalsRepository;