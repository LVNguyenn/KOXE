import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { LegalDetails, LegalDocuments } from "../entities";

const LegalsRepository = {

    async createLegalDocuments(data: any) {
        try {
            const legalsRepository = getRepository(LegalDocuments);
            await legalsRepository.save(data);

            return FormatData("success", "create legal documents successfully!", data);
        } catch (error) {
            return FormatData("failed", "Error create new legal documents.");
        }

    },

    async createLegalDetails(data: any) {
        try {
            const legalsRepository = getRepository(LegalDetails);
            await legalsRepository.save(data);

            return FormatData("success", "create legal details successfully!", data);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error create new legal details.");
        }

    },

    async findLegalDocumentSalonId(data: any) {
        try {
            const legalRepository = getRepository(LegalDocuments);
            const queryBuilder : any = await legalRepository
            .createQueryBuilder('legalDocuments')
            .innerJoinAndSelect('legalDocuments.salon', 'salon', 'salon.salon_id = :salonId', { ...data })
            .leftJoinAndSelect('legalDocuments.documents', 'legalDetails')
            .orderBy('legalDocuments.order', 'ASC')

            if (data?.period) {
                queryBuilder.where({ period: data.period });
            }
            
            const legalDb: any = await queryBuilder.getMany();

            return FormatData("success", "find successfully!", legalDb);
        } catch (error) {
            return FormatData("failed", "Error find the legal documents.");
        }

    },
    
    async removeLegalDetailsForDocuments (data: any) {
        
    },

    async updateLegalDetailsOfDocuments (data: any) {
        
    },

    async updateLegalDocuments (data: any) {
        
    },

    async getLegalForUser (data: any) {
        
    },

    async addLegalForUser (data: any) {
        
    },

    async removeLegalForUser (data: any) {
        
    }
}

export default LegalsRepository;