export const API_BASE_URL = "http://localhost:8080";

/** 백엔드 RsData 응답 형식 (com.back.global.rsData.RsData) */
export type RsData<T> = {
  resultCode: string;
  msg: string;
  data: T;
};

export type PostDto = {
  id: number;
  createDate: string;
  modifyDate: string;
  title: string;
  content: string;
};

/**
 * 백엔드 API를 호출하고 JSON 본문을 돌려준다.
 * 연결 실패나 실패 응답이면 사용자에게 보여줄 문구를 담은 Error를 던진다.
 * 실패 응답의 문구는 백엔드 RsData의 msg를 우선 사용한다.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof init?.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error("서버에 연결할 수 없습니다.");
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = typeof body?.msg === "string" ? body.msg : null;
    throw new Error(msg ?? `요청에 실패했습니다. (${res.status})`);
  }

  return body as T;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
