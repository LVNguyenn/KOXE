import { Request, Response } from "express";
import { Process } from "../entities/Process";
import { Stage } from "../entities/Stage";
import { getRepository } from "typeorm";
import { getUserInfo } from "../helper/mInvoice";

const processController = {
  getAllProcesses: async (req: Request, res: Response) => {
    const processRepository = getRepository(Process);
    const userId: any = req.headers["userId"] || "";
    const user = await getUserInfo(userId);
    const salonId = user?.salonId.salon_id;
    let type: any = req.query.type;

    try {
      if (type === "giayto") type = 0;
      else type = 1;

      const processes = await processRepository.find({
        where: { salon: { salon_id: salonId }, type: type },
      });

      const processesSave = {
        processes,
        nbHits: processes.length,
      };

      return res.status(200).json({
        status: "success",
        processes: processesSave,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getProcessById: async (req: Request, res: Response) => {
    const processRepository = getRepository(Process);
    const stageRepository = getRepository(Stage);
    const { id } = req.params;

    try {
      const process = await processRepository.findOne({
        where: { id: id },
        relations: ["stages"],
      });

      if (!process) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No process with id: ${id}` });
      }

      process.stages.sort((a, b) => a.order - b.order);

      let stageList = [];
      for (const stage of process.stages) {
        const detail = await stageRepository.findOne({
          where: { stage_id: stage.stage_id },
          relations: ["commissionDetails"],
        });
        stageList.push(detail);
      }
      const formatProcess = {
        ...process,
        stages: stageList,
      };

      return res.status(200).json({
        status: "success",
        process: formatProcess,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createProcess: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const processRepository = getRepository(Process);
    let { name, type, descripton } = req.body;

    const user = await getUserInfo(userId);

    if (!user?.salonId) {
      return res.status(403).json({
        status: "failed",
        msg: "You do not have sufficient permissions",
      });
    }

    if (type === "giayto") type = 0;
    else type = 1;

    const salonId = user.salonId.salon_id;
    try {
      const newProcess = {
        name,
        descripton,
        type,
        salon: { salon_id: salonId },
      };

      const savedProcess = await processRepository.save(newProcess);

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        process: savedProcess,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateProcess: async (req: Request, res: Response) => {
    const { id } = req.params;
    let { name, type, description } = req.body;
    const processRepository = getRepository(Process);

    try {
      const process = await processRepository.findOne({
        where: { id: id },
        relations: ["stages"],
      });

      if (!process) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No process with id: ${id}` });
      }

      process.name = name;
      if (type === "giayto") type = 0;
      else type = 1;
      process.type = type;
      process.description = description;

      const saveProcess = await processRepository.save(process);

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        process: saveProcess,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteProcess: async (req: Request, res: Response) => {
    const { id } = req.params;
    const processRepository = getRepository(Process);
    try {
      const process = await processRepository.findOne({
        where: { id: id },
      });

      if (!process) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No process with id: ${id}` });
      }

      await processRepository.remove(process);

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

export default processController;