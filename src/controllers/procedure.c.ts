import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Process } from "../entities/Process";
import { Stage } from "../entities/Stage";
import { getUserInfo } from "../helper/mInvoice";
import search from "../helper/search";
import pagination from "../helper/pagination";

const processController = {
  getAllProcesses: async (req: Request, res: Response) => {
    const processRepository = getRepository(Process);
    const userId: any = req.headers["userId"] || "";
    const { page, per_page, q }: any = req.query;
    const user = await getUserInfo(userId);
    const salonId = user?.salonId.salon_id;
    let type: any = req.query.type;
    try {
      if (type === "giayto") type = 0;
      else if (type === "hoatieu") type = 1;
      else type = undefined;

      const whereCondition: any = { salon: { salon_id: salonId } };
      if (type !== undefined) whereCondition.type = type;

      let processes: any = await processRepository.find({
        where: whereCondition,
      });

      // search and pagination
      if (q) {
        processes = await search({ data: processes, q, fieldname: "name" });
      }

      const rs = await pagination({ data: processes, page, per_page });
      processes = rs?.data;

      let processesSave = {
        processes,
        nbHits: processes.length,
      };

      return res.status(200).json({
        status: "success",
        processes: processesSave,
        total_page: rs?.total_page,
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
    let { name, type, description } = req.body;

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
        description,
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
