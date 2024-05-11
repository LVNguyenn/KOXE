import { Request, Response } from "express";
import { Stage } from "../entities/Stage";
import { CommissionDetails } from "../entities/CommissionDetails";
import { getRepository } from "typeorm";
import { getUserInfo } from "../helper/mInvoice";

const stageController = {
  getStageByProcedureId: async (req: Request, res: Response) => {
    const stageRepository = getRepository(Stage);
    const { procedureId } = req.params;

    try {
      const stage = await stageRepository.find({
        where: { procedure: { procedure_id: procedureId } },
        relations: ["commissionDetails"],
        order: {
          order: "ASC",
        },
      });

      if (!stage) {
        return res.status(404).json({
          status: "failed",
          msg: `No stage with procedure id: ${procedureId}`,
        });
      }

      return res.status(200).json({
        status: "success",
        stage: stage,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  // getStageBySalonId: async (req: Request, res: Response) => {
  //   const userId: any = req.headers["userId"] || "";
  //   const stageRepository = getRepository(Stage);

  //   const user = await getUserInfo(userId);
  //   const salonId = user?.salonId.salon_id;

  //   try {
  //     const stage = await stageRepository.find({
  //       where: { salon: { salon_id: salonId } },
  //       relations: ["commissionDetails"],
  //     });

  //     if (!stage) {
  //       return res.status(404).json({
  //         status: "failed",
  //         msg: `No stage with salon id: ${salonId}`,
  //       });
  //     }

  //     return res.status(200).json({
  //       status: "success",
  //       stage: stage,
  //     });
  //   } catch (error) {
  //     console.log(error);
  //     return res
  //       .status(500)
  //       .json({ status: "failed", msg: "Internal server error" });
  //   }
  // },
  getStageById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const stageRepository = getRepository(Stage);

    try {
      const stage = await stageRepository.findOne({
        where: { stage_id: id },
        relations: ["commissionDetails"],
      });

      if (!stage) {
        return res.status(404).json({
          status: "failed",
          msg: `No stage with id: ${id}`,
        });
      }

      return res.status(200).json({
        status: "success",
        stage: stage,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createStage: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const stageRepository = getRepository(Stage);
    const commissionDetailsRepository = getRepository(CommissionDetails);
    const { name, processId, order, commissionRate, details } = req.body;
    let orderExists = false;
    const user = await getUserInfo(userId);

    if (!user?.salonId) {
      return res.status(403).json({
        status: "failed",
        msg: "You do not have sufficient permissions",
      });
    }

    const salonId = user.salonId.salon_id;

    try {
      const stageList = await stageRepository.find({
        where: { procedure: { procedure_id: processId } },
      });

      stageList.forEach((stage) => {
        if (stage.order === order) {
          orderExists = true;
          return;
        }
      });

      if (orderExists) {
        return res.status(400).json({
          status: "failed",
          msg: "This order already exists in this process",
        });
      }

      const newStage = {
        name,
        salon: { salon_id: salonId },
        procedure: { procedure_id: processId },
        order: order,
        commissionRate,
      };

      const savedStage = await stageRepository.save(newStage);

      if (Array.isArray(details) && details.length > 0) {
        for (const detail of details) {
          const newDetail = {
            name: detail,
            stage: { stage_id: savedStage.stage_id },
          };

          await commissionDetailsRepository.save(newDetail);
        }
      }
      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        stage: savedStage,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateStage: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, commissionRate, order, details } = req.body;
    const stageRepository = getRepository(Stage);
    const commissionDetailsRepository = getRepository(CommissionDetails);
    let orderExists = false;

    try {
      const stageList = await stageRepository.find({
        where: { procedure: { procedure_id: id } },
      });

      stageList.forEach((stage) => {
        if (stage.order === order) {
          orderExists = true;
          return;
        }
      });

      if (orderExists) {
        return res.status(400).json({
          status: "failed",
          msg: "This order already exists in this process",
        });
      }

      const stage = await stageRepository.update(id, {
        name,
        commissionRate,
        order,
      });

      if (stage.affected === 0) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No stage with id: ${id}` });
      }

      const result = await stageRepository.findOne({
        where: { stage_id: id },
      });

      const commissionStage = await commissionDetailsRepository.find({
        where: { stage: { stage_id: id } },
      });

      if (commissionStage.length > 0) {
        await commissionDetailsRepository.remove(commissionStage);
      }

      if (Array.isArray(details) && details.length > 0) {
        for (const detail of details) {
          const newDetail = {
            name: detail,
            stage: { stage_id: result?.stage_id },
          };

          await commissionDetailsRepository.save(newDetail);
        }
      }

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        stage: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteStage: async (req: Request, res: Response) => {
    const { id } = req.params;
    const stageRepository = getRepository(Stage);

    try {
      const stage = await stageRepository.delete(id);
      if (stage.affected === 0) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No stage with id: ${id}` });
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

export default stageController;
