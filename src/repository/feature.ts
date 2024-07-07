import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Feature, Package } from "../entities";

const FeatureRepository = {

    async getAll(data: any) {
        try {
            const packageRepository = getRepository(Feature);
            const packageDb = await packageRepository.find();

            return FormatData("success", "find successfully!", packageDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Can not find the packages.", []);
        }

    },
}

export default FeatureRepository;