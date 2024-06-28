import { IsNull, Like, Not, getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { SalonPayment } from "../entities";

const SalonPaymentRepository = {

    async create(data: any) {
        try {
            console.log("data: ", data)
            const newPay = new SalonPayment();
            const salonpayRepository = getRepository(SalonPayment);
            const rs = await salonpayRepository.save({...newPay, ...data});

            return FormatData("success", "created successfully!", rs);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "creat failed.");
        }
    },

    async getAll(data: any) {
        try {
            const payRepository = getRepository(SalonPayment);
            let rs;
            let queyString = await payRepository
            .createQueryBuilder("SalonPayment")
            .innerJoinAndSelect('SalonPayment.salon', 'salon', data?.salonId? 'salon.salon_id =:salonId' : '', {...data})

            if (data.phone) {
                queyString = queyString.where({custormer_phone: data.phone});
            }

            if (data.id) {
                queyString = queyString.where({id: data.id});
            }

            if (data.creator) {
                queyString = queyString.where({creator: data.creator});
            }

            rs = await queyString.getMany();

            return FormatData("success", "find successfully!", rs);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Can not find payment.");
        }
    },

    updateStatus: async(data: any) => {
        try {
            const salonpayRepository = getRepository(SalonPayment);
            const rs = await salonpayRepository.save({...data, status: true});

            return FormatData("success", "updated successfully!", rs);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "update failed.");
        }
    },

    delete: async(data: any) => {
        try {
            const salonpayRepository = getRepository(SalonPayment);
            const rs = await salonpayRepository.remove(data);

            return FormatData("success", "Deleted successfully!", rs);
        } catch (error) {
            console.log(error)
            return FormatData("failed", "Error delete.");
        }
    },
}

export default SalonPaymentRepository;