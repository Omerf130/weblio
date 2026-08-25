import { cookies } from "next/headers";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { AdminSession } from "@/models/AdminSession";
import { AdminUser } from "@/models/AdminUser";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/crypto";

function getSessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}

export async function createSession(adminUserId: string): Promise<string> {
  await connectDB();

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  await AdminSession.create({
    tokenHash,
    adminUserId: new mongoose.Types.ObjectId(adminUserId),
    expiresAt: getSessionExpiryDate(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return token;
}

export type AdminSessionUser = {
  id: string;
  name: string;
  email: string;
};

export async function getSessionFromCookie(): Promise<AdminSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  await connectDB();

  const tokenHash = hashSessionToken(token);
  const session = await AdminSession.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!session) {
    return null;
  }

  const admin = await AdminUser.findById(session.adminUserId)
    .select("name email role isActive")
    .lean();

  if (!admin || !admin.isActive || admin.role !== "admin") {
    await AdminSession.deleteOne({ _id: session._id });
    return null;
  }

  return {
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
  };
}

export async function revokeSessionByCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await connectDB();
    const tokenHash = hashSessionToken(token);
    await AdminSession.deleteOne({ tokenHash });
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
