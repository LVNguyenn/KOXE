import { getRepository } from "typeorm";
import { FormatData } from '../utils/index';
import { Notification } from "../entities";


const NotificationRepository = {

    async findByUserNotiId(data: any) {
        try {
            const userRepository = getRepository(Notification);
            const notificationeDb = await userRepository.findOneOrFail({
                where: {id: data?.notificationId, to: data?.userId}
            })

            return FormatData("success", "find successfully!", notificationeDb);
        } catch (error) {
            return FormatData("failed",  "find error.");
        }
        
    },

    async delete(data: any) {
        try {
            const userRepository = getRepository(Notification);
            const notificationeDb = await userRepository.remove(data);

            return FormatData("success", "deleted successfully!", notificationeDb);
        } catch (error) {
            return FormatData("failed",  "delete error.");
        }
        
    },
}

export default NotificationRepository;