import { Request, Response } from "express";
import { GroupSalon } from "../entities/GroupSalon";
import { Salon } from "../entities/Salon";
import { getRepository } from "typeorm";

const groupSalonController = {
  getAllGroupSalons: async (req: Request, res: Response) => {
    const groupSalonRepository = getRepository(GroupSalon);
    const salonRepository = getRepository(Salon);
    const userId: any = req.headers["userId"] || "";

    try {
      let groupSalons = await groupSalonRepository.find({
        where: { user: { user_id: userId } },
      });

      let groupSalonsWithDetails = await Promise.all(
        groupSalons.map(async (groupSalon) => {
          let detailedSalons = await Promise.all(
            groupSalon.salons.map(async (salonId: string) => {
              let detailedSalon = await salonRepository.findOne({
                where: { salon_id: salonId },
              });
              return {
                id: detailedSalon?.salon_id,
                name: detailedSalon?.name,
              };
            })
          );

          return {
            id: groupSalon.group_id,
            name: groupSalon.name,
            salons: detailedSalons,
          };
        })
      );

      return res.status(200).json({
        status: "success",
        groupSalons: groupSalonsWithDetails,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createGroupSalon: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const groupSalonRepository = getRepository(GroupSalon);
    const { name, salons } = req.body;

    try {
      const newGroupSalon = { name, user: { user_id: userId }, salons };
      const savedGroupSalon = await groupSalonRepository.save(newGroupSalon);

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        groupSalon: savedGroupSalon,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
};

export default groupSalonController;
