import { Router } from "express";
import salonController from "../controllers/salon.c";
import middlewareController from "../middleware/middleware";
import uploadCloud from "../middleware/uploader";

const router = Router();

router.get("/", salonController.getAllSalons);

// router.get(
//   "/salonId",
//   middlewareController.verifyToken,
//   salonController.getSalonIdForUser
// );
router.get(
  "/no-block",
  middlewareController.verifyToken,
  salonController.getAllSalonsNoBlock
);
router.get(
  "/users/blocked",
  middlewareController.verifyToken,
  salonController.getAllUsersBlocked
);
router.get(
  "/my-salon",
  middlewareController.verifyToken,
  salonController.getSalonByUserId
);

router.post(
  "/assign-role",
  middlewareController.verifyToken,
  middlewareController.isAdminOfSalon,
  salonController.assignRoleToUser
);

// router.post("/user", middlewareController.isAdminOfSalon, salonController.getEmployees);
router.post(
  "/user",
  middlewareController.verifyToken,
  middlewareController.havePermission("R_EMP"),
  salonController.getEmployees
);

router.post(
  "/permission",
  middlewareController.isAdminOfSalon,
  middlewareController.isEmployeeOfSalon,
  salonController.handlePermission
);

// invite user to salon
router.post(
  "/invite",
  middlewareController.verifyToken,
  middlewareController.havePermission("C_EMP"),
  salonController.inviteByEmail
);
router.post(
  "/verifyInviteUser",
  middlewareController.verifyToken,
  salonController.verifyInviteFromNotification
);
router.get("/verify-invite/:token", salonController.verifyInviteFromMail);

router.post("/employees", salonController.getAllEmployeesBySalon);
router.delete(
  "/employees/:id",
  middlewareController.verifyToken,
  salonController.deleteEmployeesBySalon
);

// role
router.get(
  "/role",
  middlewareController.verifyToken,
  salonController.getRoleForSalon
);
router.post(
  "/role",
  middlewareController.verifyToken,
  middlewareController.isAdminOfSalon,
  salonController.createNewRole
);
router.patch(
  "/role",
  middlewareController.verifyToken,
  middlewareController.isAdminOfSalon,
  salonController.updateRole
);
router.delete(
  "/role/:id",
  middlewareController.verifyToken,
  middlewareController.isAdminOfSalon,
  salonController.deleteRole
);


router.get("/:id", salonController.getSalonById);

router.patch(
  "/:id",
  middlewareController.verifyToken,
  uploadCloud.fields([
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 5 },
  ]),
  salonController.updateSalon
);

router.delete(
  "/:id",
  middlewareController.verifyToken,
  middlewareController.havePermission("D_SL"),
  salonController.deleteSalon
);

router.post(
  "/",
  middlewareController.verifyToken,
  uploadCloud.fields([
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 5 },
  ]),
  salonController.createSalon
);

export default router;
