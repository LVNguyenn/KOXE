import { Request, Response } from "express";
import { Maintenance } from "../entities/Maintenance";
import { User } from "../entities/User";
import { getRepository } from "typeorm";

const maintenanceController = {
  getAllMaintenances: async (req: Request, res: Response) => {
    const mRepository = getRepository(Maintenance);

    try {
      const maintenances = await mRepository.find({
        relations: ["salon"],
      });

      const maintenanceSave = {
        maintenances: maintenances.map((maintenance) => ({
          maintenance_id: maintenance.maintenance_id,
          name: maintenance.name,
          description: maintenance.description,
          cost: maintenance.cost,
          salon: {
            salon_id: maintenance.salon.salon_id,
            name: maintenance.salon.name,
          },
        })),
        nbHits: maintenances.length,
      };

      return res.status(200).json({
        status: "success",
        maintenances: maintenanceSave,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getMaintenanceById: async (req: Request, res: Response) => {
    const mRepository = getRepository(Maintenance);
    const { id } = req.params;

    try {
      const maintenance = await mRepository.findOne({
        where: { maintenance_id: id },
        relations: ["salon"],
      });
      if (!maintenance) {
        return res.status(404).json({
          status: "failed",
          msg: `No maintenance service with id: ${id}`,
        });
      }

      const maintenanceFormat = {
        maintenance_id: maintenance.maintenance_id,
        name: maintenance.name,
        description: maintenance.description,
        cost: maintenance.cost,
        salon: {
          salon_id: maintenance.salon.salon_id,
          name: maintenance.salon.name,
        },
      };

      return res.status(200).json({
        status: "success",
        maintenance: maintenanceFormat,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getMaintenanceBySalonId: async (req: Request, res: Response) => {
    const mRepository = getRepository(Maintenance);
    const { salonId } = req.params;

    try {
      const maintenance = await mRepository.find({
        where: { salon: { salon_id: salonId } },
      });
      if (maintenance.length === 0) {
        return res.status(404).json({
          status: "failed",
          msg: `No maintenance service found for salonId: ${salonId}`,
        });
      }

      return res.status(200).json({
        status: "success",
        maintenance: maintenance,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createMaintenance: async (req: Request, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const mRepository = getRepository(Maintenance);
    const { name, description, cost } = req.body;
    let salonId = "";

    if (cost < 0) {
      return res.status(400).json({
        status: "failed",
        msg: "Cost must be greater than or equal to 0",
      });
    }

    const user = await getRepository(User).findOne({
      where: { user_id: userId },
      relations: ["salonId"],
    });

    if (user?.salonId) salonId = user.salonId.salon_id;
    else {
      return res.status(403).json({
        status: "failed",
        msg: "You do not have sufficient permissions",
      });
    }

    try {
      const newMaintenance = {
        name,
        description,
        cost,
        salon: { salon_id: salonId },
      };
      const savedMaintenance = await mRepository.save(newMaintenance);

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        maintenance: savedMaintenance,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateMaintenance: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, cost } = req.body;
    const mRepository = getRepository(Maintenance);

    try {
      const maintenance = await mRepository.update(id, {
        name,
        description,
        cost,
      });
      if (maintenance.affected === 0) {
        return res.status(404).json({
          status: "failed",
          msg: `No maintenance service with id: ${id}`,
        });
      }
      const result = await mRepository.findOne({
        where: { maintenance_id: id },
      });

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        maintenance: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteMaintenance: async (req: Request, res: Response) => {
    const { id } = req.params;
    const mRepository = getRepository(Maintenance);
    try {
      const maintenance = await mRepository.delete(id);
      if (maintenance.affected === 0) {
        return res.status(404).json({
          status: "failed",
          msg: `No maintenance service with id: ${id}`,
        });
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

export default maintenanceController;
