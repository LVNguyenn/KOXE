import { Router } from "express";
import middlewareController from "../middleware/middleware";
import legalsController from "../controllers/legals.c";

const router = Router();

router.post(
    "/create",
    legalsController.createLegalDetails
);

router.post(
    "/",
    legalsController.getLegalDocuments
);


export default router;