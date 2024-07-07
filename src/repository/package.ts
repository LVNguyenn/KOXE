import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Package } from "../entities";

const PackageRepository = {

    async getAll(data: any) {
        try {
            const packageRepository = getRepository(Package);
            const packageDb = await packageRepository.find({
                relations: ['features']
            });

            return FormatData("success", "find successfully!", packageDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Can not find the packages.", []);
        }

    },
}

export default PackageRepository;