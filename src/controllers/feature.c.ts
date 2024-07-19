import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Feature } from "../entities/Feature";
import { newLogs } from "../helper/createLogs";
//import Cache from "../config/node-cache";
import search from "../helper/search";
import pagination from "../helper/pagination";

const featureController = {
  getAllFeatures: async (req: Request, res: Response) => {
    const { page, per_page, q }: any = req.query;
    const featureRepository = getRepository(Feature);
    // get value from cache
    // const valueCache = Cache.get("feature");

    // if (valueCache) {
    //     return res.status(200).json({
    //         status: "success",
    //         features: valueCache
    //     });
    // }

    try {
      let features = await featureRepository.find({
        order: {"createdAt": "DESC"}
      });

      // search and pagination
      if (q) {
        features = await search({ data: features, q, fieldname: "name" });
      }

      const rs = await pagination({ data: features, page, per_page });

      const featureSave = {
        features: rs?.data,
        nbHits: features.length,
      };
      // add cache
      // Cache.set("feature", featureSave)

      return res.status(200).json({
        status: "success",
        features: featureSave,
        total_page: rs?.total_page,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  getFeatureById: async (req: Request, res: Response) => {
    const featureRepository = getRepository(Feature);
    const { id } = req.params;
    // get value cache
    // const valueCache = Cache.get(id+"feature");

    // if (valueCache) {
    //     return res.status(200).json({
    //         status: "success",
    //         feature: valueCache
    //     });
    // }

    try {
      const feature = await featureRepository.findOne({
        where: {
          feature_id: id,
        },
      });
      if (!feature) {
        return res
          .status(200)
          .json({ status: "failed", msg: `No feature with id: ${id}` });
      }
      // set value for cache
      // Cache.set(id+"feature", feature);

      return res.status(200).json({
        status: "success",
        feature: feature,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  createFeature: async (req: Request, res: Response) => {
    const featureRepository = getRepository(Feature);
    const { name, description, keyMap, salonId } = req.body;

    try {
      const newFeature = { name, description, keyMap };
      const savedFeature = await featureRepository.save(newFeature);

      newLogs(salonId, `${req.user} created new feature - ${name}.`);
      // del old value cache
      // Cache.del("feature");

      return res.status(201).json({
        status: "success",
        msg: "Create successfully!",
        feature: savedFeature,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  updateFeature: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, keyMap, salonId } = req.body;
    const featureRepository = getRepository(Feature);

    try {
      const feature = await featureRepository.update(id, {
        name,
        description,
        keyMap,
      });
      if (feature.affected === 0) {
        return res
          .status(200)
          .json({ status: "failed", msg: `No feature with id: ${id}` });
      }
      const result = await featureRepository.findOne({
        where: {
          feature_id: id,
        },
      });
      newLogs(salonId, `${req.user} updated feature - ${result?.name}`);
      // Cache.del([id+"feature", "feature"]);

      return res.status(200).json({
        status: "success",
        msg: "Update successfully!",
        feature: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Internal server error" });
    }
  },
  deleteFeature: async (req: Request, res: Response) => {
    const { id } = req.params;
    const featureRepository = getRepository(Feature);
    try {
      const feature = await featureRepository.delete(id);
      if (feature.affected === 0) {
        return res
          .status(200)
          .json({ status: "failed", msg: `No feature with id: ${id}` });
      }

      newLogs(req.body.salonId, `${req.user} deleted feature - ${feature.raw}`); // maybe erro feature.raw
      // Cache.del([id+"feature", "feature"]);

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

export default featureController;
