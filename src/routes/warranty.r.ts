import { Router } from 'express';
import warrantyController from '../controllers/warranty.c';
import middlewareController from '../middleware/middleware';

const router = Router();

router.post("/create", middlewareController.verifyToken, middlewareController.havePermission("C_WRT"), warrantyController.createNewWarranty);
router.post("/", middlewareController.verifyToken3, warrantyController.getWarrantyForSalon);
router.post("/push-warranty", middlewareController.verifyToken, middlewareController.havePermission("U_WRT"), warrantyController.pushWarrantyCar);
router.patch("/update", middlewareController.verifyToken, middlewareController.havePermission("U_WRT"), warrantyController.updateWarranty);
router.delete("/delete", middlewareController.verifyToken, middlewareController.havePermission("D_WRT"), warrantyController.delete);
router.post("/cancel", middlewareController.verifyToken, middlewareController.havePermission("U_WRT"), warrantyController.cancelWarranty);

router.post("/add-maintenance", middlewareController.verifyToken, middlewareController.havePermission("U_WRT"), warrantyController.addMaintence);
// router.post("/remove-maintenance", middlewareController.verifyToken, middlewareController.havePermission("R_WRT"), warrantyController.removeMaintence);

export default router;
