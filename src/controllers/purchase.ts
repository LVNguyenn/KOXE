import { Request, Response } from "express";
import { Purchase, Salon } from "../entities";
import { getRepository } from "typeorm";

const userPurchaseController = {
  getAllPurchasePackages: async (req: Request, res: Response) => {
    const userPurchaseRepository = getRepository(Purchase);
    let user_id: any = req.headers["userId"] || "";

    const salon = await getRepository(Salon).findOne({
      where: [{ user_id: user_id }, { employees: { user_id: user_id } }],
    });

    try {
      const userPurchases = await userPurchaseRepository.find({
        where: [{ userId: user_id }, { userId: salon?.user_id }],
        relations: ["package", "package.features"],
      });

      const userPurchasedPackages = userPurchases.map((purchase) => ({
        package_id: purchase.package.package_id,
        features: purchase.package.features.map((feature) => ({
          //id: feature.feature_id,
          //name: feature.name,
          keyMap: feature.keyMap,
        })),
      }));

      return res.status(200).json({
        status: "success",
        purchasedPackages: userPurchasedPackages,
      });
    } catch (error) {
      return { status: "failed", msg: "Internal server error" };
    }
  },
  // createPurchasePackage: async (req: Request, res: Response) => {
  //     const userPurchaseRepository = getRepository(Purchase);
  //     const { packageId, month, total } = req.body;
  //     const purchaseDate = getLocalDateTime();
  //     const expirationDate  = calExpiryDate(purchaseDate, month);
  //     const userId: any = req.headers['userId'] || "";

  //     try {
  //         const newPurchase = { userId, packageId, purchaseDate, expirationDate, total };
  //         const savedPurchase = await userPurchaseRepository.save(newPurchase);
  //         res.status(201).json({
  //             status: "success",
  //             msg: "Create successfully!",
  //             feature: savedPurchase
  //         });
  //     } catch (error) {
  //         return res.status(500).json({ status: "failed", msg: "Internal server error" });
  //     }
  // },
};

export default userPurchaseController;
