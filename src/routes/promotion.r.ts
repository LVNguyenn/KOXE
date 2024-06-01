import { Router } from "express";
import promotionController from "../controllers/promotion.c";
import middlewareController from "../middleware/middleware";
import uploadCloud from "../middleware/uploader";

const router = Router();

router.get("/", promotionController.getAllPromotions);
router.get("/:id", promotionController.getPromotionById);
router.get("/salon/:salonId", promotionController.getAllPromotionsBySalonId);
router.post(
  "/",
  middlewareController.verifyToken,
  uploadCloud.array("banner", 5),
  promotionController.createPromotion
);
router.patch(
  "/:id",
  uploadCloud.array("banner", 5),
  promotionController.updatePromotion
);
router.delete("/:id", promotionController.deletePromotion);

export default router;
