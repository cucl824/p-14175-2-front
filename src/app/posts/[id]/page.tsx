"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { PostDto } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const isValidId = /^\d+$/.test(id);
  const { data: post, error: fetchError } = useApiData<PostDto>(
    isValidId ? `/api/v1/posts/${id}` : null,
  );
  const error = isValidId ? fetchError : "잘못된 글 번호입니다.";

  if (error !== null)
    return (
      <>
        <div role="alert" className="text-red-600">
          글을 불러오지 못했습니다. {error}
        </div>
        <Link href="/posts">목록으로</Link>
      </>
    );

  if (post === null) return <div>로딩중...</div>;

  return (
    <>
      <h1>글 상세페이지</h1>

      <div>번호 : {post.id}</div>
      <div>제목 : {post.title}</div>
      <div className="whitespace-pre-line">{post.content}</div>

      <div className="flex gap-2 mt-2">
        <Link href="/posts">목록으로</Link>
      </div>
    </>
  );
}
