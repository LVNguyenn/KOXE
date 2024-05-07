import { Router } from "express";
import middlewareController from "../middleware/middleware";
import legalsController from "../controllers/legals.c";

const router = Router();

router.post(
    "/create-process",
    legalsController.createProcess
);

router.post(
    "/create-documents",
    legalsController.createLegalDocuments
);

router.post(
    "/create-details",
    legalsController.createLegalDetails
);

router.post(
    "/process",
    legalsController.getAllProcess
);

router.patch(
    "/update-process",
    legalsController.updateProcess
);

router.delete(
    "/delete-details",
    legalsController.removeLegalDetailsForDocuments
);

router.patch(
    "/update-details",
    legalsController.updateLegalDetailsOfDocuments
);

router.patch(
    "/update-documents",
    legalsController.updateLegalDocuments
);

router.delete(
    "/delete-documents",
    legalsController.removeLegalDocuments
);

router.post(
    "/add-user",
    legalsController.addLegalForUser
);

export default router;