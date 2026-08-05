import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { LeadController } from "./lead.controller";
import { LeadValidation } from "./lead.validation";

const router = Router();

router.get("/stats", auth("leads.view", "leads.manage"), LeadController.getLeadStats);

router.get("/", auth("leads.view", "leads.manage"), LeadController.getAllLeads);

router.get("/:id", auth("leads.view", "leads.manage"), LeadController.getLeadById);

router.patch(
  "/:id",
  auth("leads.manage"),
  validateRequest(LeadValidation.updateLeadSchema),
  LeadController.updateLead
);

router.post(
  "/:id/notes",
  auth("leads.manage"),
  validateRequest(LeadValidation.addNoteSchema),
  LeadController.addNote
);

router.delete("/:id", auth("leads.manage"), LeadController.deleteLead);

export const LeadRoutes = router;
