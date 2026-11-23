"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PostForm, { type PostFormValues } from "@/components/PostForm";
import PostLoadError from "@/components/PostLoadError";
import { apiFetch } from "@/lib/api";
import { usePost } from "@/lib/usePost";

export default function Page() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { post, error } = usePost(id);

  if (error !== null) return <PostLoadError error={error} />;

  if (post === null) return <div>로딩중...</div>;

  const modify = async (values: PostFormValues) => {
    await apiFetch(`/api/v1/posts/${post.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    router.replace(`/posts/${post.id}`);
  };

  return (
    <>
      <h1>{post.id}번 글 수정</h1>
      <PostForm
        initialValues={{ title: post.title, content: post.content }}
        submitLabel="수정"
        onSubmit={modify}
      />
      <Link href={`/posts/${post.id}`}>취소</Link>
    </>
  );
}
