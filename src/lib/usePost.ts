"use client";

import { apiFetch, type PostDto } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";

/**
 * URL의 글 번호로 글을 조회한다. path 파라미터는 항상 문자열이므로 숫자인지 확인한 뒤 쓴다.
 * 숫자가 아닌 번호는 요청 없이 오류로 돌려준다.
 */
export function usePost(postIdStr: string) {
  const isValidId = /^\d+$/.test(postIdStr);
  const postId = Number(postIdStr);
  const { data: post, error } = useApiData<PostDto>(isValidId ? `/api/v1/posts/${postId}` : null);

  // postId는 클로저로 기억하므로 호출하는 쪽에서 다시 넘길 필요가 없다. 실패하면 ApiError를 던진다.
  const deletePost = () => apiFetch(`/api/v1/posts/${postId}`, { method: "DELETE" });

  return { postId, post, error: isValidId ? error : "잘못된 글 번호입니다.", deletePost };
}
