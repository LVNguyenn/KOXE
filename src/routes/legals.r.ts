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


export default router;