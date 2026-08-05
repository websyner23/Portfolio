import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = Router();

router.post(
  "/",
  auth("users.manage"),
  validateRequest(UserValidation.createUserSchema),
  UserController.createUser
);

router.get("/", auth("users.manage"), UserController.getAllUsers);

router.get("/:id", auth("users.manage"), UserController.getUserById);

router.patch(
  "/:id",
  auth("users.manage"),
  validateRequest(UserValidation.updateUserSchema),
  UserController.updateUser
);

router.post(
  "/:id/reset-password",
  auth("users.manage"),
  validateRequest(UserValidation.resetUserPasswordSchema),
  UserController.resetUserPassword
);

router.delete("/:id", auth("users.manage"), UserController.deleteUser);

export const UserRoutes = router;
