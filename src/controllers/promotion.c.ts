import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Promotion } from "../entities/Promotion";
import { getUserInfo } from "../helper/mInvoice";
import moment from "moment";
const cloudinary = require("cloudinary").v2;
import { getFileName } from "../utils/index";
import dayjs from "dayjs";
import momenttz from "moment-timezone";
interface MulterFile {
  path: string;
  filename: string;
}

interface MulterFileRequest extends Request {
  files?: MulterFile[];
}

const promotionController = {
  getAllPromotions: async (req: Request, res: Response) => {
    const promotionRepository = getRepository(Promotion);

    try {
      let promotions = await promotionRepository.find({
        relations: ["salon"],
        order: { createdAt: "DESC" },
      });

      let formattedPromotion = promotions.map((promotion) => ({
        id: promotion.promotion_id,
        title: promotion.title,
        description: promotion.description,
        thumbnail: promotion.banner[0],
        createdAt: dayjs(promotion.createdAt).format("DD/MM/YYYY"),
        startDate: dayjs(promotion.startDate).format("DD/MM/YYYY"),
        endDate: dayjs(promotion.endDate).format("DD/MM/YYYY"),
        salon: {
          salon_id: promotion.salon.salon_id,
          name: promotion.salon.name,
        },
      }));

      const promotionSave = {
        promotions: formattedPromotion,
        nbHits: formattedPromotion.length,
      };

      return res.status(200).json({
        status: "success",
        promotions: promotionSave,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getAllPromotionsBySalonId: async (req: Request, res: Response) => {
    const promotionRepository = getRepository(Promotion);
    const { salonId } = req.params;

    try {
      let promotions = await promotionRepository.find({
        where: { salon: { salon_id: salonId } },
        relations: ["salon"],
        order: { createdAt: "DESC" },
      });

      if (promotions.length === 0) {
        return res.status(200).json({
          status: "failed",
          msg: `No promotion found for salonId: ${salonId}`,
        });
      }

      let formattedPromotion = promotions.map((promotion) => ({
        id: promotion.promotion_id,
        title: promotion.title,
        description: promotion.description,
        thumbnail: promotion.banner[0],
        createdAt: dayjs(promotion.createdAt).format("DD/MM/YYYY"),
        startDate: dayjs(promotion.startDate).format("DD/MM/YYYY"),
        endDate: dayjs(promotion.endDate).format("DD/MM/YYYY"),
        salon: {
          salon_id: promotion.salon.salon_id,
          name: promotion.salon.name,
        },
      }));

      return res.status(200).json({
        status: "success",
        promotion: formattedPromotion,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getPromotionById: async (req: Request, res: Response) => {
    const promotionRepository = getRepository(Promotion);
    const { id } = req.params;

    try {
      const promotion = await promotionRepository.findOne({
        where: { promotion_id: id },
        relations: ["salon"],
      });

      if (!promotion) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No promotion with id: ${id}` });
      }

      const formatPromotion = {
        ...promotion,
        createdAt: dayjs(promotion.createdAt).format("DD/MM/YYYY"),
        updatedAt: dayjs(promotion.updatedAt).format("DD/MM/YYYY"),
        startDate: dayjs(promotion.startDate).format("DD/MM/YYYY"),
        endDate: dayjs(promotion.endDate).format("DD/MM/YYYY"),
        salon: {
          salon_id: promotion.salon.salon_id,
          name: promotion.salon.name,
        },
      };

      return res.status(200).json({
        status: "success",
        promotion: formatPromotion,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createPromotion: async (req: Request | MulterFileRequest, res: Response) => {
    const userId: any = req.headers["userId"] || "";
    const promotionRepository = getRepository(Promotion);
    let banner = [""],
      filename = [""];
    const {
      title,
      description,
      contentHtml,
      contentMarkdown,
      startDate,
      endDate,
    } = req.body;

    const user = await getUserInfo(userId);

    if (!user?.salonId) {
      return res.status(403).json({
        status: "failed",
        msg: "You do not have sufficient permissions",
      });
    }
    const salonId = user.salonId.salon_id;

    try {
      if ("files" in req && req.files) {
        const arrayImages = req.files;
        banner = arrayImages.map((obj) => obj.path);
        filename = arrayImages.map((obj) => obj.filename);
      }

      const newPromotion = {
        title,
        description,
        contentHtml,
        contentMarkdown,
        startDate,
        endDate,
        banner: banner,
        //createdAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
        //updatedAt: moment().format("YYYY-MM-DDTHH:mm:ss"),
        salon: { salon_id: salonId },
      };

      let savedPromotion = await promotionRepository.save(newPromotion);

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        promotion: savedPromotion,
      });
    } catch (error) {
      if (filename.length !== 0) {
        filename.forEach(async (url) => {
          cloudinary.uploader.destroy(url);
        });
      }
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updatePromotion: async (req: Request | MulterFileRequest, res: Response) => {
    const { id } = req.params;
    const {
      title,
      description,
      contentHtml,
      contentMarkdown,
      startDate,
      endDate,
    } = req.body;
    const promotionRepository = getRepository(Promotion);

    let image = null,
      filename = null;
    if ("files" in req && req.files) {
      const arrayImages = req.files;
      image = arrayImages.map((obj) => obj.path);
      filename = arrayImages.map((obj) => obj.filename);
    }

    try {
      let newPromotion: any = {
        title,
        description,
        contentHtml,
        contentMarkdown,
        startDate,
        endDate,
        updatedAt: momenttz().tz("Asia/Saigon").format(),
      };
      if (Array.isArray(image) && image.length > 0) newPromotion.banner = image;
      const { promotion_id, ...other } = newPromotion;

      const oldPromotion = await promotionRepository.findOne({
        where: { promotion_id: id },
      });

      if (!oldPromotion) {
        if (filename && filename.length !== 0) {
          filename.forEach(async (url) => {
            cloudinary.uploader.destroy(url);
          });
        }
        return res
          .status(404)
          .json({ status: "failed", msg: `No promotion with id: ${id}` });
      }

      if (
        image &&
        image.length !== 0 &&
        Array.isArray(oldPromotion.banner) &&
        oldPromotion.banner.length > 0
      ) {
        oldPromotion.banner.forEach((image) => {
          cloudinary.uploader.destroy(getFileName(image));
        });
      }

      const savePromotion = { ...oldPromotion, ...other };
      const promotion = await promotionRepository.save(savePromotion);

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        promotion: promotion,
      });
    } catch (error) {
      if (filename && filename.length !== 0) {
        filename.forEach(async (url) => {
          cloudinary.uploader.destroy(url);
        });
      }
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deletePromotion: async (req: Request, res: Response) => {
    const { id } = req.params;
    const promotionRepository = getRepository(Promotion);
    try {
      const promotion = await promotionRepository.findOne({
        where: { promotion_id: id },
      });

      if (!promotion) {
        return res
          .status(404)
          .json({ status: "failed", msg: `No promotion with id: ${id}` });
      }

      if (Array.isArray(promotion.banner) && promotion.banner.length > 0) {
        promotion.banner.forEach((image) => {
          cloudinary.uploader.destroy(getFileName(image));
        });
      }

      await promotionRepository.delete(id);

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

export default promotionController;
