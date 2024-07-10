import { Request, Response } from "express";
import { Not, getRepository } from "typeorm";
import { Notification } from "../entities";

const notificationController = {
  get: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || req.body.salonId;
    const { id }: any = req.body;
    const notificationRepository = getRepository(Notification);

    try {
      let notificationDb: any = await notificationRepository.find({
        where: { to: userId, id: id },
        order: { create_at: "DESC" },
      });

      return res.status(200).json({
        status: "success",
        notifications: notificationDb,
      });
    } catch (error) {
      return res.status(400).json({
        status: "failed",
        msg: "invaid information.",
      });
    }
  },

  update: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || req.body.salonId;
    const { id }: any = req.body;
    const notificationRepository = getRepository(Notification);

    try {
      let notificationDb: any = await notificationRepository.findOneOrFail({
        where: { to: userId, id: id },
      });

      await notificationRepository.save({ ...notificationDb, read: true });

      return res.status(200).json({
        status: "success",
      });
    } catch (error) {
      return res.status(400).json({
        status: "failed",
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || req.body.salonId;
    const { id } = req.body;
    const deleteObject: Object = { id: id, to: userId };
    const filteredObject = Object.fromEntries(
      Object.entries(deleteObject).filter(([key, value]) => value !== undefined)
    );
    const notifiRepository = getRepository(Notification);

    try {
      await notifiRepository.delete(filteredObject);

      return res.status(200).json({
        status: "success",
        msg: "delete successfully!",
      });
    } catch (error) {
      return res.status(200).json({
        status: "failed",
        msg: "delete error.",
      });
    }
  },
};

export default notificationController;
