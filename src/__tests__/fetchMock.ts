import { vi } from "vitest";
import { API_BASE_URL } from "@/lib/api";

type Route = {
  method?: string;
  path: string;
  status?: number;
  body?: unknown;
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** 등록된 메서드·경로에 맞는 응답을 돌려주는 fetch 대역. 등록되지 않은 요청은 실패시킨다. */
export function mockFetch(routes: Route[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const route = routes.find(
      (r) => (r.method ?? "GET") === method && `${API_BASE_URL}${r.path}` === url,
    );
    if (!route) throw new Error(`예상하지 못한 요청: ${method} ${url}`);
    return jsonResponse(route.body ?? null, route.status ?? 200);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
