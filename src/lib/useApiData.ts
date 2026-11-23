"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";

type State<T> = { path: string; data: T | null; error: string | null };

/**
 * 컴포넌트가 화면에 있는 동안 path의 데이터를 조회한다.
 * path가 null이면 조회하지 않는다. data와 error가 모두 null이면 로딩 중이다.
 */
export function useApiData<T>(path: string | null) {
  const [state, setState] = useState<State<T> | null>(null);

  useEffect(() => {
    if (path === null) return;

    let ignore = false;

    apiFetch<T>(path)
      .then((data) => {
        if (!ignore) setState({ path, data, error: null });
      })
      .catch((e) => {
        if (!ignore) setState({ path, data: null, error: errorMessage(e) });
      });

    return () => {
      ignore = true;
    };
  }, [path]);

  // cacheComponents에서는 떠난 페이지가 언마운트되지 않고 Activity로 숨겨진다.
  // 숨겨질 때 결과를 비워, 다시 보일 때 예전 데이터 대신 로딩 후 새 데이터를 보여준다.
  useLayoutEffect(() => {
    return () => setState(null);
  }, [path]);

  // path가 바뀐 직후에는 이전 path의 결과를 보여주지 않는다.
  const current = state?.path === path ? state : null;

  return { data: current?.data ?? null, error: current?.error ?? null };
}
