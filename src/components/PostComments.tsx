"use client";

import { useId } from "react";
import type { PostCommentDto } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";

export default function PostComments({ postId }: { postId: number }) {
  // 숨겨진 이전 글 화면이 함께 남아 있을 수 있어 id가 겹치지 않게 한다.
  const headingId = useId();
  const { data: comments, error } = useApiData<PostCommentDto[]>(
    `/api/v1/posts/${postId}/comments`,
  );

  return (
    <section aria-labelledby={headingId} className="mt-4">
      <h2 id={headingId}>댓글</h2>

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
            <li key={comment.id} className="whitespace-pre-line">
              {comment.content}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
