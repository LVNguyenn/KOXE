import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Car, LegalDetails, LegalDocuments, Process } from "../entities";

const LegalsRepository = {

    async createProcess(data: any) {
        try {
            const processRepository = getRepository(Process);
            const processDb = await processRepository.save(data);

            return FormatData("success", "create process successfully!", processDb);
        } catch (error) {
            return FormatData("failed", "Error create new process.");
        }
    },

    async createLegalDocuments(data: any) {
        try {
            const legalsRepository = getRepository(LegalDocuments);
            const documentDb = await legalsRepository.save(data);

            return FormatData("success", "create legal documents successfully!", documentDb);
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

    async findProcessByIdSalonId(data: any) {
        try {
            const processRepository = getRepository(Process);
            const processDb = await processRepository.findOneOrFail({
                where: {id: data.processId},
                relations: ['salon']
            })

            if (processDb.salon?.salon_id !== data?.salonId) 
                return FormatData("failed", "Error find the process");

            return FormatData("success", "find successfully!", processDb);
        } catch (error) {
            return FormatData("failed", "Error find the process");
        }
    },

    async getAllProcessBySalonId(data: any) {
        try {
            const processRepository = getRepository(Process);
            const processDb : any = await processRepository
            .createQueryBuilder('Process')
            .leftJoinAndSelect('Process.salon', 'salon', 'salon.salon_id = :salonId', { ...data })
            .leftJoinAndSelect('Process.documents', 'legalDocuments')
            .leftJoinAndSelect('legalDocuments.details', 'legalDetails')
            .getMany();

            return FormatData("success", "find successfully!", processDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error find the legal documents.");
        }
    },

    async findLegalDocumentSalonId(data: any) {
        try {
            const legalRepository = getRepository(LegalDocuments);
            const queryBuilder : any = await legalRepository
            .createQueryBuilder('legalDocuments')
            .leftJoinAndSelect('legalDocuments.details', 'legalDetails')
            .orderBy('legalDocuments.order', 'ASC')

            if (data?.period) {
                queryBuilder.where({ period: data.period });
            }

            if (data?.carId) {
                queryBuilder.innerJoinAndSelect('legalDocuments.car', 'car', 'car.car_id = :carId', { ...data })
            }
            
            const legalDb: any = await queryBuilder.getMany();

            return FormatData("success", "find successfully!", legalDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error find the legal documents.");
        }

    },

    async updateProcessById (data: any) {
        try {
            const processRepository = getRepository(Process)
            const processDb = await this.findProcessByIdSalonId(data);
            const newProcess = await processRepository.save({...processDb?.data, name: data?.name});

            return FormatData("success", "Updated the process successfully!", newProcess);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error update the process.");
        }
    },
    
    async removeLegalDetailsForDocuments (data: any) {
        try {
            const legalRepository = getRepository(LegalDetails);
            const legalDb = await this.findLegalDetailsByPeriodSalonId(data);
            console.log(legalDb?.data)
            const rmObject: any = {id: legalDb?.data?.id, name: legalDb?.data?.name, update_date: legalDb?.data?.update_date}
            await legalRepository.remove(rmObject);

            return FormatData("success", "delete legal details successfully!", legalDb?.data);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error delete the legal details.");
        }
    },

    async findLegalDetailsByPeriodSalonId(data: any) {
        try {
            const legalRepository = getRepository(LegalDetails);
            const legalDb = await legalRepository
            .createQueryBuilder('LegalDetails')
            .leftJoinAndSelect('LegalDetails.period', 'legalDocuments', 'LegalDetails.period = :period', { ...data })
            .innerJoinAndSelect('legalDocuments.salon', 'salon', 'salon.salon_id = :salonId', { ...data })
            .getOne()

            return FormatData("success", "find successfully!", legalDb);
        } catch (error) {
            return FormatData("failed", "Error find the legal documents.");
        }

    },

    async updateLegalDetailsOfDocuments (data: any) {
        try {
            const legalRepository = getRepository(LegalDetails)
            let legalDb = await this.findLegalDetailsByPeriodSalonId(data);
            await legalRepository.save({...legalDb?.data, name: data?.name, update_date: new Date()});

            return FormatData("success", "Updated the legal details successfully!", legalDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error update the legal details.");
        }
    },

    async updateLegalDocuments (data: any) {
        try {
            const legalRepository = getRepository(LegalDocuments)
            let legalDb = await this.findLegalDocumentSalonId(data);
            await legalRepository.save({...legalDb?.data[0], name: data?.name, reuse: data?.reuse});

            return FormatData("success", "Updated the legal documents successfully!", legalDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error update the legal documents.");
        }
    },

    async removeLegalDocuments (data: any) {
        try {
            const legalRepository = getRepository(LegalDocuments);
            const legalDb = await this.findLegalDocumentSalonId(data);
            await legalRepository.remove(legalDb?.data[0]);

            return FormatData("success", "delete legal documents successfully!", legalDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error delete the legal documents.");
        }
    },

    async getLegalForUser (data: any) {
        
    },

    // need to review
    async addLegalForUser (data: any) {
        try {
            const legalRepository = getRepository(LegalDocuments);
            const user = !data?.olduser?[data?.user]: [...data?.olduser, data?.user];
            const legalDb = await legalRepository.save({...data?.legal, user})
            
            return FormatData("success", "add legal documents for the user successfully!", legalDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error add documents for the user.");
        }
    },

    async removeLegalForUser (data: any) {
        
    },

    async setLegalForCar (data: any) {

    },
}

export default LegalsRepository;