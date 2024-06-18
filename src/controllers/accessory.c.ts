import { Request, Response } from "express";
import { Accessory } from "../entities/Accessory";
import { getRepository } from "typeorm";
import { getUserInfo } from "../helper/mInvoice";
import search from "../helper/search";
import pagination from "../helper/pagination";

const accessoryController = {
  //   getAllAccessorys: async (req: Request, res: Response) => {
  //     const accessoryRepository = getRepository(Accessory);
  //     try {
  //       const accessories = await accessoryRepository.find({});

  //       const accessorySave = {
  //         accessories,
  //         nbHits: accessories.length,
  //       };

  //       return res.status(200).json({
  //         status: "success",
  //         accessories: accessorySave,
  //       });
  //     } catch (error) {
  //       return res
  //         .status(500)
  //         .json({ status: "failed", msg: "Internal server error" });
  //     }
  //   },
  getAccessoryBySalonId: async (req: Request, res: Response) => {
    const accessoryRepository = getRepository(Accessory);
    const { salonId } = req.params;
    const { page, per_page, q }: any = req.query;

    try {
      let accessory = await accessoryRepository.find({
        where: { salon: { salon_id: salonId } },
      });

      if (accessory.length === 0) {
        return res.status(404).json({
          status: "failed",
          msg: `No accessory found for salonId: ${salonId}`,
        });
      }

      // search and pagination
      if (q) {
        accessory = await search({ data: accessory, q, fieldname: "name" });
      }

      const rs = await pagination({ data: accessory, page, per_page });

      return res.status(200).json({
        status: "success",
        accessory: rs?.data,
        total_page: rs?.total_page,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getAccessoryById: async (req: Request, res: Response) => {
    const accessoryRepository = getRepository(Accessory);
    const { id } = req.params;

    try {
      const accessory = await accessoryRepository.findOne({
        where: { accessory_id: id },
        relations: ["salon"],
      });
      if (!accessory) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No accessory with id: ${id}` });
      }

      return res.status(200).json({
        status: "success",
        accessory: accessory,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createAccessory: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const accessoryRepository = getRepository(Accessory);
    const { name, manufacturer, price, icon } = req.body;

    const user = await getUserInfo(userId);

    if (!user?.salonId) {
      return res.status(403).json({
        status: "failed",
        msg: "You do not have sufficient permissions",
      });
    }

    const salonId = user.salonId.salon_id;

    try {
      const newAccessory = {
        name,
        manufacturer,
        price,
        salon: { salon_id: salonId },
        icon,
      };
      const savedAccessory = await accessoryRepository.save(newAccessory);

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        accessory: savedAccessory,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateAccessory: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, manufacturer, price, icon } = req.body;
    const accessoryRepository = getRepository(Accessory);

    try {
      const accessory = await accessoryRepository.update(id, {
        name,
        manufacturer,
        price,
        icon,
      });
      if (accessory.affected === 0) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No accessory with id: ${id}` });
      }
      const result = await accessoryRepository.findOne({
        where: {
          accessory_id: id,
        },
      });

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        accessory: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteAccessory: async (req: Request, res: Response) => {
    const { id } = req.params;
    const accessoryRepository = getRepository(Accessory);
    try {
      const accessory = await accessoryRepository.delete(id);
      if (accessory.affected === 0) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No accessory with id: ${id}` });
      }
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

export default accessoryController;
