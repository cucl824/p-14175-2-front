"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import PostCommentWriteAndList from "@/components/PostCommentWriteAndList";
import PostLoadError from "@/components/PostLoadError";
import { errorMessage } from "@/lib/api";
import { usePost } from "@/lib/usePost";
import { usePostComments } from "@/lib/usePostComments";

function PostInfo({ postState }: { postState: ReturnType<typeof usePost> }) {
  const { post, deletePost: _deletePost } = postState;
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deletePost = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await _deletePost();
      router.replace("/posts");
    } catch (e) {
      setDeleteError(errorMessage(e));
      setIsDeleting(false);
    }
  };

  // 부모가 글을 불러온 뒤에만 그리지만, 타입을 좁히기 위해 확인한다.
  if (post === null) return null;

  return (
    <>
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

export default function Page() {
  // path 파라미터는 항상 문자열이다. 숫자로 바꾸고 검사하는 일은 usePost가 맡는다.
  const { id: postIdStr } = useParams<{ id: string }>();
  const postState = usePost(postIdStr);
  // 댓글은 글을 불러온 뒤에만 조회한다.
  const postCommentsState = usePostComments(postState.post === null ? null : postState.postId);

  if (postState.error !== null) return <PostLoadError error={postState.error} />;

  if (postState.post === null) return <div>로딩중...</div>;

  return (
    <>
      <h1>글 상세페이지</h1>

      <PostInfo postState={postState} />

      <PostCommentWriteAndList postCommentsState={postCommentsState} />
    </>
  );
}
