import { Router } from "express";
import carController from "../controllers/car.c";
import uploadCloud from "../middleware/uploader";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get("/user", middlewareController.verifyToken, carController.getAllCarForUser);
router.get("/", carController.getAllCars);
router.get("/:id", carController.getCarById);
router.get("/salon/:salon_id", carController.getCarsOfSalon);
router.get(
  "/brand/:brand/salon/:salon_id",
  carController.getAllCarsByBrandOfSalon
);
router.post(
  "/",
  middlewareController.verifyToken,
  uploadCloud.array("image", 5),
  middlewareController.havePermission("C_CAR"),
  carController.createCar
);
router.patch(
  "/:id",
  middlewareController.verifyToken,
  uploadCloud.array("image", 5),
  middlewareController.havePermission("U_CAR"),
  carController.updateCar
);
router.delete(
  "/:id",
  middlewareController.verifyToken,
  middlewareController.havePermission("D_CAR"),
  carController.deleteCar
);



// router.post("/legals", carController.getAllLegalByCar);
export default router;
