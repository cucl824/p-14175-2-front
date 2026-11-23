"use client";

import { useId, useLayoutEffect, useState } from "react";
import CommentForm from "@/components/CommentForm";
import { apiFetch, errorMessage, type PostCommentDto } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";

export default function PostComments({ postId }: { postId: number }) {
  // 숨겨진 이전 글 화면이 함께 남아 있을 수 있어 id가 겹치지 않게 한다.
  const headingId = useId();
  const {
    data: comments,
    error,
    updateData: updateComments,
  } = useApiData<PostCommentDto[]>(`/api/v1/posts/${postId}/comments`);

  const [deletingIds, setDeletingIds] = useState<ReadonlySet<number>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // cacheComponents에서 화면이 Activity로 숨겨질 때 지난 오류·진행 상태를 비운다.
  useLayoutEffect(() => {
    return () => {
      setDeleteError(null);
      setDeletingIds(new Set());
    };
  }, []);

  const setDeleting = (commentId: number, deleting: boolean) =>
    setDeletingIds((prev) => {
      const next = new Set(prev);
      if (deleting) next.add(commentId);
      else next.delete(commentId);
      return next;
    });

  const deleteComment = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    setDeleting(commentId, true);
    setDeleteError(null);

    try {
      await apiFetch(`/api/v1/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
      updateComments((list) => list.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setDeleteError(`댓글을 삭제하지 못했습니다. ${errorMessage(err)}`);
    } finally {
      setDeleting(commentId, false);
    }
  };

  return (
    <section aria-labelledby={headingId} className="mt-4">
      <h2 id={headingId}>댓글</h2>

      {deleteError !== null && (
        <div role="alert" className="text-red-600">
          {deleteError}
        </div>
      )}

      {error !== null ? (
        <div role="alert" className="text-red-600">
          댓글을 불러오지 못했습니다. {error}
        </div>
      ) : comments === null ? (
        <div>댓글 로딩중...</div>
      ) : comments.length === 0 ? (
        <div>댓글이 없습니다.</div>
      ) : (
        <ul>
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2">
              <span id={`${headingId}-comment-${comment.id}`} className="whitespace-pre-line">
                {comment.content}
              </span>
              <button
                type="button"
                onClick={() => deleteComment(comment.id)}
                disabled={deletingIds.has(comment.id)}
                aria-label="댓글 삭제"
                aria-describedby={`${headingId}-comment-${comment.id}`}
                className="disabled:opacity-50"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {comments !== null && (
        <CommentForm
          postId={postId}
          onWritten={(comment) =>
            updateComments((list) =>
              // 다시 조회한 목록에 이미 들어 있을 수 있다.
              list.some((c) => c.id === comment.id) ? list : [...list, comment],
            )
          }
        />
      )}
    </section>
  );
}
