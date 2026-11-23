"use client";

import { useRouter } from "next/navigation";
import PostForm, { type PostFormValues } from "@/components/PostForm";
import { apiFetch, type PostDto, type RsData } from "@/lib/api";

export default function Page() {
  const router = useRouter();

  const write = async (values: PostFormValues) => {
    const rsData = await apiFetch<RsData<PostDto> | null>("/api/v1/posts", {
      method: "POST",
      body: JSON.stringify(values),
    });
    // 이미 작성된 뒤이므로 응답 본문이 이상해도 다시 제출하지 않도록 목록으로 보낸다.
    router.replace(rsData?.data ? `/posts/${rsData.data.id}` : "/posts");
  };

  return (
    <>
      <h1>글 쓰기</h1>
      <PostForm submitLabel="작성" onSubmit={write} />
    </>
  );
}
