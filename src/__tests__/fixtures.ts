import type { PostCommentDto, PostDto } from "@/lib/api";

export function makePost(id: number, overrides: Partial<PostDto> = {}): PostDto {
  return {
    id,
    createDate: "2026-11-20T10:00:00",
    modifyDate: "2026-11-20T10:00:00",
    title: `제목 ${id}`,
    content: `내용 ${id}`,
    ...overrides,
  };
}

export function makeComment(id: number, overrides: Partial<PostCommentDto> = {}): PostCommentDto {
  return {
    id,
    createDate: "2026-11-20T11:00:00",
    modifyDate: "2026-11-20T11:00:00",
    content: `댓글 ${id}`,
    ...overrides,
  };
}

/** 글 상세 화면이 처음 보낼 글·댓글 조회 요청의 응답 */
export function postDetailRoutes(post: PostDto, comments: PostCommentDto[] = []) {
  return [
    { path: `/api/v1/posts/${post.id}`, body: post },
    { path: `/api/v1/posts/${post.id}/comments`, body: comments },
  ];
}
