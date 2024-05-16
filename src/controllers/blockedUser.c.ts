import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { getUserInfo } from "../helper/mInvoice";
import { Connection, Salon } from "../entities";

const blockUserController = {
  // LÀM THÊM GỠ BLOCK
  // Sửa (userId ?) (Xong)
  // không thấy được post khi block
  createblockUser: async (req: Request, res: Response) => {
    const salonRepository = getRepository(Salon);
    const connectionRepository = getRepository(Connection);
    const user_id: any = req.headers["userId"] || "";
    const user = await getUserInfo(user_id);
    const salonId = user?.salonId.salon_id;
    const { connectionId } = req.body;
    let userId;
    try {
      const connection = await connectionRepository.findOne({
        where: { connection_id: connectionId },
      });

      if (connection) {
        userId = connection.user.user_id;
      } else {
        return res
          .status(400)
          .json({ status: "failed", msg: "Connection does not exists" });
      }

      const salon = await salonRepository.findOne({
        where: { salon_id: salonId },
      });

      if (salon) {
        salon.blockUsers.push(userId);
        await salonRepository.save(salon);
      } else {
        return res
          .status(400)
          .json({ status: "failed", msg: "Salon does not exists" });
      }

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        salon: salon,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
};

export default blockUserController;
