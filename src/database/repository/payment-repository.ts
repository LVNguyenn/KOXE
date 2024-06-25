import { getRepository } from 'typeorm';
import { Package, Purchase } from '../models';
import { calExpiryDate } from '../../utils';
require("dotenv").config({ path: "./server/.env" });


export const PaymentRepository = {

    async findPackageById(data: any) {
        try {
            const packageRepository = getRepository(Package);
            const packageDb = await packageRepository.findOneOrFail({
                where: { package_id: data?.packageId }
            });

            return packageDb;
        } catch (error) {
            return null;
        }
    },


    async findUserPurchase(data: any) {
        try {
            const userPackageRepository = getRepository(Purchase);
            const userPkgDb = await userPackageRepository.findOneOrFail({
                where: { userId: data?.userId, packageId: data?.packageId }
            });

            return userPkgDb;
        } catch (error) {
            return null;
        }
    },

    async savePurchase(data: any) {
        try {
            const userPackageRepository = getRepository(Purchase);
            let saveInfo = new Purchase();
            saveInfo.expirationDate = calExpiryDate(
                saveInfo.purchaseDate,
                Number(data?.months)
            );
            let expirationDate = !data?.renewMonths ? saveInfo.expirationDate : data.renewMonths;
            data.total += data.oldTotal;
            const rs = await userPackageRepository.save({ ...saveInfo, ...data, expirationDate })
            
            return rs;
        } catch (error) {
            console.log("Error save: ", error)
            return null;
        }
    },

    async getPurchase(data: any) {
        try {
            const userPurchaseRepository = getRepository(Purchase);
            const userPurchases = await userPurchaseRepository.find({
                where: [{ userId: data?.user_id }, { userId: data?.salon?.user_id }],
                relations: ["package", "package.features"],
            });

            return userPurchases;
        } catch (error) {
            return null;
        }
    }
}

export default PaymentRepository;