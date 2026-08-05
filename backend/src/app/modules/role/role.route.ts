import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { RoleController } from "./role.controller";
import { RoleValidation } from "./role.validation";

const router = Router();

router.get("/permissions", auth("roles.manage"), RoleController.getPermissions);

router.post(
  "/",
  auth("roles.manage"),
  validateRequest(RoleValidation.createRoleSchema),
  RoleController.createRole
);

router.get("/", auth("roles.manage", "users.manage"), RoleController.getAllRoles);

router.get("/:id", auth("roles.manage"), RoleController.getRoleById);

router.patch(
  "/:id",
  auth("roles.manage"),
  validateRequest(RoleValidation.updateRoleSchema),
  RoleController.updateRole
);

router.delete("/:id", auth("roles.manage"), RoleController.deleteRole);

export const RoleRoutes = router;
