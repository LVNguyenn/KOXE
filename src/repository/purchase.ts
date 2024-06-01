import { IsNull, Like, Not, getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Purchase, Salon } from "../entities";

const PurchaseRepository = {

    async getAllPurchase(data: any) {
        try {
            const purchaseRepository = getRepository(Purchase);
            const purchaseDb = await purchaseRepository
            .createQueryBuilder("purchase")
            .leftJoinAndSelect('purchase.package', 'package')
            .select("purchase.packageId, COUNT(*) AS count, package.name")
            .groupBy("purchase.packageId, package.name")
            .orderBy("count", "DESC")
            .getRawMany();

            return FormatData("success", "find successfully!", purchaseDb);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Can not find purchases.");
        }
    },

    
}

export default PurchaseRepository;