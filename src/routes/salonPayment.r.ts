import { Router } from 'express';
import payController from '../controllers/salonPayment.c';
import middlewareController from '../middleware/middleware';

const router = Router();

router.post("/create", middlewareController.verifyToken, middlewareController.havePermission("C_PMSL"), payController.createPayment);
router.get("/", middlewareController.verifyToken, payController.get);
router.post("/confirm-user", middlewareController.verifyToken, payController.confirmPaidFromUser);
router.post("/confirm-salon", middlewareController.verifyToken, middlewareController.havePermission("U_PMSL"), payController.confirmPaidFromSalon);
router.delete("/:id", middlewareController.verifyToken, middlewareController.havePermission("D_PMSL"), payController.delete);

export default router;
