"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, errorMessage, type PostDto } from "@/lib/api";

export default function Page() {
  const [posts, setPosts] = useState<PostDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    apiFetch<PostDto[]>("/api/v1/posts")
      .then((data) => {
        if (!ignore) setPosts(data);
      })
      .catch((e) => {
        if (!ignore) setError(errorMessage(e));
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <h1>글 목록</h1>

      {error !== null ? (
        <div role="alert" className="text-red-600">
          글 목록을 불러오지 못했습니다. {error}
        </div>
      ) : posts === null ? (
        <div>로딩중...</div>
      ) : posts.length === 0 ? (
        <div>글이 없습니다.</div>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/posts/${post.id}`}>{post.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
