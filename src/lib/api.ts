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

export type PostCommentDto = {
  id: number;
  createDate: string;
  modifyDate: string;
  content: string;
};

/**
 * apiFetch가 실패하면 던지는 오류. 백엔드 RsData의 resultCode·msg를 담는다.
 * RsData를 받지 못한 경우(연결 실패, Spring 기본 오류 본문 등)는 직접 채운다.
 */
export class ApiError extends Error {
  constructor(
    readonly resultCode: string,
    msg: string,
  ) {
    super(msg);
    this.name = "ApiError";
  }
}

/**
 * 백엔드 API를 호출하고 JSON 본문을 돌려준다.
 * fetch는 4xx·5xx 응답도 성공으로 넘기므로, 응답 코드를 보고 ApiError를 던진다.
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
    throw new ApiError("network-error", "서버에 연결할 수 없습니다.");
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    if (typeof body?.resultCode === "string" && typeof body?.msg === "string") {
      throw new ApiError(body.resultCode, body.msg);
    }
    // 상태 코드는 resultCode에 담는다(예: 500-0).
    throw new ApiError(`${res.status}-0`, "요청에 실패했습니다.");
  }

  return body as T;
}

/** 화면에 보여줄 오류 문구. ApiError면 "resultCode : msg" 형태다. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return `${e.resultCode} : ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}
