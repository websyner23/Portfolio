import mongoose from "mongoose";
import config from "../config";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from "../app/modules/role/role.constant";
import { Role } from "../app/modules/role/role.model";
import { User } from "../app/modules/user/user.model";
import { seedCms } from "./seedCms";

/**
 * Idempotent seeder — safe to re-run. Existing documents are updated in place
 * (system roles keep their permission set current) and nothing is duplicated.
 */

const SYSTEM_ROLES: {
  name: string;
  description: string;
  permissions: string[];
}[] = [
  {
    name: SUPER_ADMIN_ROLE,
    description: "Full unrestricted access to every module",
    permissions: ALL_PERMISSIONS,
  },
  {
    name: "admin",
    description: "Day-to-day company administration",
    permissions: ALL_PERMISSIONS.filter(
      (p) => !["roles.manage", "users.manage"].includes(p)
    ),
  },
  {
    name: "hr",
    description: "Employees, attendance, payroll and documents",
    permissions: [
      "dashboard.view",
      "employees.manage",
      "attendance.punch",
      "attendance.view",
      "attendance.manage",
      "payroll.manage",
      "documents.manage",
    ],
  },
  {
    name: "finance",
    description: "Finance, payroll and project income",
    permissions: [
      "dashboard.view",
      "finance.view",
      "finance.manage",
      "payroll.manage",
      "projects.view",
    ],
  },
  {
    name: "employee",
    description: "Self-service punch panel and project access",
    permissions: ["attendance.punch", "projects.view"],
  },
];

const seedRoles = async () => {
  for (const role of SYSTEM_ROLES) {
    await Role.findOneAndUpdate(
      { name: role.name },
      { $set: { ...role, isSystem: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  · role "${role.name}" (${role.permissions.length} permissions)`);
  }
};

const seedSuperAdmin = async () => {
  const role = await Role.findOne({ name: SUPER_ADMIN_ROLE });
  if (!role) throw new Error("super-admin role missing");

  const existing = await User.findOne({ email: config.superAdmin.email });
  if (existing) {
    console.log(`  · super admin already exists (${existing.email}) — left unchanged`);
    return;
  }

  await User.create({
    name: "Super Admin",
    email: config.superAdmin.email,
    password: config.superAdmin.password,
    role: role._id,
    status: "active",
    needsPasswordChange: false,
  });

  console.log(`  · super admin created: ${config.superAdmin.email}`);
};

async function main() {
  console.log("\n▸ Seeding WebSyner database…\n");

  await mongoose.connect(config.databaseUrl);
  console.log("  · connected to MongoDB\n");

  console.log("Roles & permissions:");
  await seedRoles();

  console.log("\nAccounts:");
  await seedSuperAdmin();

  console.log("\nWebsite content:");
  await seedCms();

  console.log("\n✔ Seed complete.\n");
  console.log(`  Admin login → ${config.adminUrl}`);
  console.log(`  Email:    ${config.superAdmin.email}`);
  console.log(`  Password: ${config.superAdmin.password}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("\n✖ Seed failed:", err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
