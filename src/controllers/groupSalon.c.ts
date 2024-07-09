import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Salon } from "../entities/Salon";
import { GroupSalon } from "../entities/GroupSalon";

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
  getGroupSalonById: async (req: Request, res: Response) => {
    const groupSalonRepository = getRepository(GroupSalon);
    const salonRepository = getRepository(Salon);
    const { id } = req.params;

    try {
      const groupSalon = await groupSalonRepository.findOne({
        where: { group_id: id },
      });
      if (!groupSalon) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No groupSalon with id: ${id}` });
      }

      const detailedSalons = await Promise.all(
        groupSalon.salons.map(async (salonId: string) => {
          const detailedSalon = await salonRepository.findOne({
            where: { salon_id: salonId },
          });
          return {
            id: detailedSalon?.salon_id,
            name: detailedSalon?.name,
          };
        })
      );

      const detailedGroupSalon = {
        id: groupSalon.group_id,
        name: groupSalon.name,
        salons: detailedSalons,
      };

      return res.status(200).json({
        status: "success",
        groupSalon: detailedGroupSalon,
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
  updateGroupSalon: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, salons } = req.body;
    const groupSalonRepository = getRepository(GroupSalon);

    try {
      const groupSalon = await groupSalonRepository.update(id, {
        name,
        salons,
      });
      if (groupSalon.affected === 0) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No groupSalon with id: ${id}` });
      }
      const result = await groupSalonRepository.findOne({
        where: { group_id: id },
      });

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        groupSalon: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteGroupSalon: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const { id } = req.params;
    const groupSalonRepository = getRepository(GroupSalon);
    try {
      const groupSalon = await groupSalonRepository.findOne({
        where: { group_id: id },
        relations: ["user"],
      });

      if (!groupSalon) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No groupSalon with id: ${id}` });
      }

      if (groupSalon.user.user_id !== userId) {
        return res.status(403).json({
          status: "failed",
          msg: "You do not have permission to delete this groupSalon.",
        });
      }

      await groupSalonRepository.delete(id);

      res.status(200).json({
        status: "success",
        msg: "Delete successfully!",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
};

export default groupSalonController;
