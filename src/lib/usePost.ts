"use client";

import type { PostDto } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";

/** URL의 글 번호(id)로 글을 조회한다. 숫자가 아닌 번호는 요청 없이 오류로 돌려준다. */
export function usePost(id: string) {
  const isValidId = /^\d+$/.test(id);
  const { data: post, error } = useApiData<PostDto>(isValidId ? `/api/v1/posts/${id}` : null);

  return { post, error: isValidId ? error : "잘못된 글 번호입니다." };
}
