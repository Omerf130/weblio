import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { AdminUser } from "@/models/AdminUser";

export type VerifiedAdmin = {
  id: string;
  name: string;
  email: string;
};

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<VerifiedAdmin | null> {
  await connectDB();

  const admin = await AdminUser.findOne({ email })
    .select("+passwordHash name email role isActive")
    .lean();

  if (!admin) {
    return null;
  }

  if (!admin.isActive || admin.role !== "admin") {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, admin.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  await AdminUser.updateOne(
    { _id: admin._id },
    { $set: { lastLoginAt: new Date() } }
  );

  return {
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
  };
}
