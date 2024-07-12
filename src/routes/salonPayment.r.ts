import { Router } from 'express';
import payController from '../controllers/salonPayment.c';
import inforController from '../controllers/inforPayment.c';
import middlewareController from '../middleware/middleware';

const router = Router();

// payment method salon
router.post("/create-method", middlewareController.verifyToken, middlewareController.havePermission("C_PMT"), inforController.create);
router.get("/method", middlewareController.verifyToken2, inforController.get);
router.patch("/method", middlewareController.verifyToken, middlewareController.havePermission("U_PMT"), inforController.update);
router.delete("/method/:id", middlewareController.verifyToken, middlewareController.havePermission("D_PMT"), inforController.delete);

router.post("/create", middlewareController.verifyToken, middlewareController.havePermission("C_PMSL"), payController.createPayment);
router.post("/confirm-user", middlewareController.verifyToken2, payController.confirmPaidFromUser);
router.post("/confirm-salon", middlewareController.verifyToken, middlewareController.havePermission("U_PMSL"), payController.confirmPaidFromSalon);
router.delete("/:id", middlewareController.verifyToken, middlewareController.havePermission("D_PMSL"), payController.delete);
router.get("/", middlewareController.verifyToken2, payController.get);


export default router;
