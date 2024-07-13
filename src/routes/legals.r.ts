import { Router } from "express";
import middlewareController from "../middleware/middleware";
import legalsController from "../controllers/legals.c";

const router = Router();

router.post(
    "/create-process",
    middlewareController.verifyToken,
    middlewareController.havePermission("C_PC"),
    legalsController.createProcess
);

router.post(
    "/create-documents",
    middlewareController.verifyToken,
    middlewareController.havePermission("C_DC"),
    legalsController.createLegalDocuments
);

router.post(
    "/create-details",
    middlewareController.verifyToken,
    middlewareController.havePermission("C_DL"),
    legalsController.createLegalDetails
);

router.post(
    "/process",
    middlewareController.verifyToken2,
    legalsController.getAllProcess
);

router.patch(
    "/update-process",
    middlewareController.verifyToken,
    middlewareController.havePermission("U_PC"),
    legalsController.updateProcess
);

router.patch(
    "/update-documents",
    middlewareController.verifyToken,
    middlewareController.havePermission("U_DC"),
    legalsController.updateLegalDocuments
);

router.delete(
    "/delete-process",
    middlewareController.verifyToken,
    middlewareController.havePermission("D_PC"),
    legalsController.removeProcess
);

router.delete(
    "/delete-documents",
    middlewareController.verifyToken,
    middlewareController.havePermission("D_DC"),
    legalsController.removeLegalDocuments
);


router.post(
    "/check-details-user",
    middlewareController.verifyToken,
    middlewareController.havePermission("U_DT"),
    legalsController.addLegalDetailsForUser
);

router.post(
    "/get-legals-user",
    middlewareController.verifyToken2,
    legalsController.getLegalsByPhoneCarId
);

router.patch(
    "/update-period-user",
    middlewareController.verifyToken2,
    legalsController.updateNewPeriodForUser
);

export default router;