"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import PostLoadError from "@/components/PostLoadError";
import { apiFetch, errorMessage } from "@/lib/api";
import { usePost } from "@/lib/usePost";

export default function Page() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { post, error } = usePost(id);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deletePost = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await apiFetch(`/api/v1/posts/${id}`, { method: "DELETE" });
      router.replace("/posts");
    } catch (e) {
      setDeleteError(errorMessage(e));
      setIsDeleting(false);
    }
  };

  if (error !== null) return <PostLoadError error={error} />;

  if (post === null) return <div>로딩중...</div>;

  return (
    <>
      <h1>글 상세페이지</h1>

      <div>번호 : {post.id}</div>
      <div>제목 : {post.title}</div>
      <div className="whitespace-pre-line">{post.content}</div>

      {deleteError !== null && (
        <div role="alert" className="text-red-600">
          삭제하지 못했습니다. {deleteError}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <Link href="/posts">목록으로</Link>
        <Link href={`/posts/${post.id}/modify`}>수정</Link>
        <button
          type="button"
          onClick={deletePost}
          disabled={isDeleting}
          className="disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </>
  );
}
