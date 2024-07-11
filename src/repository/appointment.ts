import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Appointment } from "../entities";

const AppointmentRepository = {

    async updateRead(data: any) {
        try {
            const repository = getRepository(Appointment);
    
            await repository
                .createQueryBuilder()
                .update(Appointment)
                .set({ read: true })
                .where("read = :read AND user_id = :userId", { read: false, userId: data?.userId })
                .execute();

            return FormatData("success", "update successfully!");
        } catch (error) {
            console.log(error)
            return FormatData("failed", "update failed.");
        }

    },
}

export default AppointmentRepository;