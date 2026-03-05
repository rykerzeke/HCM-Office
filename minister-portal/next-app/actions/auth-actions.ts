"use server";

import { cookies } from "next/headers";
import { apiGet, apiPost } from "@/lib/api-client";
import { LoginResponse, UserSummary } from "@/types/backend";
import { ActionState } from "@/types";

const AUTH_COOKIE = "auth_token";

export async function loginAction(credentials: {
  email: string;
  password: string;
}): Promise<ActionState> {
  try {
    const data = await apiPost<LoginResponse>("/login", credentials);

    const jar = await cookies();
    jar.set(AUTH_COOKIE, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours, matching Fastify JWT expiry
    });

    return {
      status: "success",
      message: "Logged in successfully",
      data: data.user,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to login";
    return { status: "error", message: msg };
  }
}

export async function logoutAction(): Promise<ActionState> {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE);
  return { status: "success", message: "Logged out" };
}

export async function getCurrentUserAction(): Promise<ActionState> {
  try {
    const user = await apiGet<UserSummary>("/me");
    return { status: "success", message: "User retrieved", data: user };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to get user";
    return { status: "error", message: msg };
  }
}
