import type { PostDto } from "@/lib/api";

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
