import bcrypt from "bcryptjs";
import { assertDatabaseNameInUri, getSeedEnv } from "@/lib/env";
import { connectDB, disconnectDB } from "@/lib/db/mongoose";
import { AdminUser } from "@/models/AdminUser";

const BCRYPT_ROUNDS = 12;

async function seedAdmin(): Promise<void> {
  const env = getSeedEnv();
  assertDatabaseNameInUri(env.MONGODB_URI);

  await connectDB();

  const normalizedEmail = env.ADMIN_EMAIL.trim().toLowerCase();
  const existingAdmins = await AdminUser.find().select("email name role").lean();

  if (existingAdmins.length > 0) {
    const matchingAdmin = existingAdmins.find(
      (admin) => admin.email.toLowerCase() === normalizedEmail
    );

    if (matchingAdmin) {
      console.log("Admin user already exists. No changes made.");
      await disconnectDB();
      process.exit(0);
      return;
    }

    console.error("Another admin user already exists. Aborting.");
    await disconnectDB();
    process.exit(1);
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, BCRYPT_ROUNDS);

  await AdminUser.create({
    name: env.ADMIN_NAME.trim(),
    email: normalizedEmail,
    passwordHash,
    role: "admin",
    isActive: true,
  });

  console.log(`Admin user created successfully for ${normalizedEmail}.`);
  await disconnectDB();
  process.exit(0);
}

seedAdmin().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown seed error";
  console.error(`Admin seed failed: ${message}`);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
