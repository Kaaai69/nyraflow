"use client";

import { getInitData } from "@/lib/telegram/webapp";

// Единая точка обращения к своему API: initData подставляется автоматически.

export type ApiError = { error: string; status: number; field?: string };

export class ApiRequestError extends Error {
  constructor(readonly info: ApiError) {
    super(`API ${info.status}: ${info.error}`);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `tma ${getInitData()}`,
      ...init.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok || payload.ok === false) {
    throw new ApiRequestError({
      status: response.status,
      error: typeof payload.error === "string" ? payload.error : "unknown",
      field: typeof payload.field === "string" ? payload.field : undefined,
    });
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
