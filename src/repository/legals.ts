import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { LegalDetails, LegalDocuments } from "../entities";

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

    async findLegalDocumentByLegalIdSalonId(data: any) {
        try {
            const legalRepository = getRepository(LegalDocuments);
            const legalDb: LegalDocuments = await legalRepository.findOneOrFail({
                where: {period: data?.period},
                relations: ['salon']
            })

            if (legalDb?.salon?.salon_id !== data?.salonId) {
                return FormatData("failed", "Error find the legal document");
            }

            return FormatData("success", "find successfully!", legalDb);
        } catch (error) {
            return FormatData("failed", "Error find the legal documents.");
        }

    },
}

export default LegalsRepository;