import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { getUserInfo } from "../helper/mInvoice";
import { Salon } from "../entities";

const blockUserController = {
  // LÀM THÊM GỠ BLOCK
  // Sửa (userId ?)
  // không thấy được post khi block
  createblockUser: async (req: Request, res: Response) => {
    const salonRepository = getRepository(Salon);
    const user_id: any = req.headers["userId"] || "";
    const user = await getUserInfo(user_id);
    const salonId = user?.salonId.salon_id;
    const { userId } = req.body;
    try {
      const salon = await salonRepository.findOne({
        where: { salon_id: salonId },
      });

      if (salon) {
        salon.blockUsers.push(userId);
        await salonRepository.save(salon);
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
