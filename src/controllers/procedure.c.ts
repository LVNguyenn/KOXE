import { Request, Response } from "express";
import { Procedure } from "../entities/Procedure";
import { Stage } from "../entities/Stage";
import { getRepository } from "typeorm";
import { getUserInfo } from "../helper/mInvoice";

const procedureController = {
  getAllProcedures: async (req: Request, res: Response) => {
    const procedureRepository = getRepository(Procedure);
    const userId: any = req.headers["userId"] || "";
    const user = await getUserInfo(userId);
    const salonId = user?.salonId.salon_id;
    const type: any = req.query.type;

    try {
      const procedures = await procedureRepository.find({
        where: { salon: { salon_id: salonId }, type: type },
      });

      const procedureSave = {
        procedures,
        nbHits: procedures.length,
      };

      return res.status(200).json({
        status: "success",
        procedures: procedureSave,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getProcedureById: async (req: Request, res: Response) => {
    const procedureRepository = getRepository(Procedure);
    const stageRepository = getRepository(Stage);
    const { id } = req.params;

    try {
      const procedure = await procedureRepository.findOne({
        where: { procedure_id: id },
        relations: ["stages"],
      });

      if (!procedure) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No procedure with id: ${id}` });
      }

      procedure.stages.sort((a, b) => a.order - b.order);

      let stageList = [];
      for (const stage of procedure.stages) {
        const detail = await stageRepository.findOne({
          where: { stage_id: stage.stage_id },
          relations: ["commissionDetails"],
        });
        stageList.push(detail);
      }
      const formatProcedure = {
        ...procedure,
        stages: stageList,
      };

      return res.status(200).json({
        status: "success",
        procedure: formatProcedure,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createProcedure: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const procedureRepository = getRepository(Procedure);
    const { name, type } = req.body;

    const user = await getUserInfo(userId);

    if (!user?.salonId) {
      return res.status(403).json({
        status: "failed",
        msg: "You do not have sufficient permissions",
      });
    }

    const salonId = user.salonId.salon_id;
    try {
      const newProcedure = {
        name,
        type,
        salon: { salon_id: salonId },
      };

      const savedProcedure = await procedureRepository.save(newProcedure);

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        procedure: savedProcedure,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateProcedure: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, type } = req.body;
    const procedureRepository = getRepository(Procedure);

    try {
      const procedure = await procedureRepository.findOne({
        where: { procedure_id: id },
        relations: ["stages"],
      });

      if (!procedure) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No procedure with id: ${id}` });
      }

      procedure.name = name;
      procedure.type = type;

      await procedureRepository.save(procedure);

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        procedure: procedure,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteProcedure: async (req: Request, res: Response) => {
    const { id } = req.params;
    const procedureRepository = getRepository(Procedure);
    try {
      const procedure = await procedureRepository.findOne({
        where: { procedure_id: id },
      });

      if (!procedure) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No procedure with id: ${id}` });
      }

      await procedureRepository.remove(procedure);

      res.status(200).json({
        status: "success",
        msg: "Delete successfully!",
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
};

export default procedureController;
