"use client";

import { apiFetch, type PostCommentDto, type RsData } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";

/**
 * 한 글의 댓글 목록을 조회하고, 작성·삭제 결과를 새로고침 없이 목록에 반영한다.
 * postId가 null이면(글을 아직 못 불러왔으면) 조회하지 않는다.
 * postId는 클로저로 기억하므로 아래 함수들은 댓글에 관한 값만 받는다. 실패하면 ApiError를 던진다.
 */
export function usePostComments(postId: number | null) {
  const {
    data: postComments,
    error,
    updateData: updatePostComments,
  } = useApiData<PostCommentDto[]>(postId === null ? null : `/api/v1/posts/${postId}/comments`);

  const writeComment = async (content: string) => {
    const rsData = await apiFetch<RsData<PostCommentDto>>(`/api/v1/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    const written = rsData.data;
    // 다시 조회한 목록에 이미 들어 있을 수 있다.
    updatePostComments((list) =>
      list.some((comment) => comment.id === written.id) ? list : [...list, written],
    );
  };

  const deleteComment = async (commentId: number) => {
    await apiFetch(`/api/v1/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
    updatePostComments((list) => list.filter((comment) => comment.id !== commentId));
  };

  return { postComments, error, writeComment, deleteComment };
}
