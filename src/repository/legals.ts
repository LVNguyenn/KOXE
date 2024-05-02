import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { LegalDetails, LegalDocuments } from "../entities";

const LegalsRepository = {

    async createLegalDocuments(data: any) {
        try {
            const legalsRepository = getRepository(LegalDocuments);
            await legalsRepository.save(data);

            return FormatData("success", "create legal details successfully!", data);
        } catch (error) {
            return FormatData("success", "Error create new legals.");
        }

    },

    async findLegalDocumentSalonId(data: any) {
        try {
            const legalRepository = getRepository(LegalDocuments);
            const queryBuilder : any = await legalRepository
            .createQueryBuilder('legalDocuments')
            .innerJoinAndSelect('legalDocuments.salon', 'salon', 'salon.salon_id = :salonId', { ...data })
            // .leftJoinAndSelect('legalDocuments.car', 'car')
            .leftJoinAndSelect('legalDocuments.documents', 'legalDetails')

            if (data?.period) {
                queryBuilder.where({ period: data.period });
            }
            
            const legalDb: any = await queryBuilder.getMany();

            return FormatData("success", "find successfully!", legalDb);
        } catch (error) {
            return FormatData("failed", "Error find the legal documents.");
        }

    },
    
}

export default LegalsRepository;