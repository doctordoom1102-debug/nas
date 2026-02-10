import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { UserRole } from "./models/User";

const SECRET = process.env.JWT_SECRET || "nasa-control-secret";

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
}

export function signToken(payload: SessionPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nasa_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
