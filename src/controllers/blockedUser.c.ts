import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Post, Salon } from "../entities";
import { getUserInfo } from "../helper/mInvoice";

const blockUserController = {
  blockUser: async (req: Request, res: Response) => {
    const salonRepository = getRepository(Salon);
    const postRepository = getRepository(Post);
    const user_id: any = req.headers["userId"] || "";
    const user = await getUserInfo(user_id);
    const salonId = user?.salonId.salon_id;
    const { postId } = req.body;
    let userId;
    try {
      const post = await postRepository.findOne({
        where: { post_id: postId },
        relations: ["postedBy"],
      });

      if (post) {
        userId = post.postedBy.user_id;
      } else {
        return res
          .status(400)
          .json({ status: "failed", msg: "This post does not exists" });
      }

      const salon = await salonRepository.findOne({
        where: { salon_id: salonId },
      });

      if (salon) {
        if (!salon.blockUsers) salon.blockUsers = [];
        salon.blockUsers.push(userId);
        await salonRepository.save(salon);
      } else {
        return res
          .status(400)
          .json({ status: "failed", msg: "This salon does not exists" });
      }

      return res.status(201).json({
        status: "success",
        msg: "Blocked user successfully!",
        salon: salon,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  unblockUser: async (req: Request, res: Response) => {
    const salonRepository = getRepository(Salon);
    const user_id: any = req.headers["userId"] || "";
    const user = await getUserInfo(user_id);
    const salonId = user?.salonId.salon_id;
    const { userId } = req.body;
    try {
      let salon = await salonRepository.findOne({
        where: { salon_id: salonId },
      });

      if (salon) {
        let index = salon.blockUsers.indexOf(userId);
        if (index > -1) {
          salon.blockUsers.splice(index, 1);
          salon = await salonRepository.save(salon);
        } else {
          return res
            .status(400)
            .json({ status: "failed", msg: "User does not exists" });
        }
      } else {
        return res
          .status(400)
          .json({ status: "failed", msg: "This salon does not exists" });
      }

      return res.status(201).json({
        status: "success",
        msg: "Unblocked user successfully!",
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
