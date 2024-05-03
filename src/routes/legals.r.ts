import { Router } from "express";
import middlewareController from "../middleware/middleware";
import legalsController from "../controllers/legals.c";

const router = Router();

router.post(
    "/create",
    legalsController.createLegalDocuments
);

router.post(
    "/",
    legalsController.getLegalDocuments
);

router.post(
    "/create-details",
    legalsController.createLegalDetails
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

export default router;