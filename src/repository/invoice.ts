import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Invoice } from "../entities";


const InvoiceRepository = {

    async findById(data: any) {
        try {
            const userRepository = getRepository(Invoice);
            const invoiceDb = await userRepository.findOneOrFail({
                where: {invoice_id: data?.invoiceId}
            })

            return FormatData("success", "find successfully!", invoiceDb);
        } catch (error) {
            return FormatData("failed",  "find error.");
        }
        
    },

    async delete(data: any) {
        try {
            const userRepository = getRepository(Invoice);
            const invoiceDb = await userRepository.remove(data);

            return FormatData("success", "delete successfully!", invoiceDb);
        } catch (error) {
            return FormatData("failed",  "delete error.");
        }
    }
}

export default InvoiceRepository;