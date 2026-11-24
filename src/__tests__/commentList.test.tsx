import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import Page from "@/app/posts/[id]/page";
import { mockFetch } from "./fetchMock";
import { makeComment, makePost } from "./fixtures";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const post1Route = { path: "/api/v1/posts/1", body: makePost(1) };

test("글 상세 아래에 댓글 목록을 보여준다", async () => {
  mockFetch([
    post1Route,
    { path: "/api/v1/posts/1/comments", body: [makeComment(1, { content: "댓글 1-1" }), makeComment(2, { content: "댓글 1-2" })] },
  ]);

  render(<Page />);

  const section = await screen.findByRole("region", { name: "댓글" });
  expect(await within(section).findByText("댓글 1-1")).toBeInTheDocument();
  expect(within(section).getByText("댓글 1-2")).toBeInTheDocument();
  expect(within(section).queryByText("댓글 로딩중...")).not.toBeInTheDocument();
});

test("댓글이 없으면 안내를 보여준다", async () => {
  mockFetch([post1Route, { path: "/api/v1/posts/1/comments", body: [] }]);

  render(<Page />);

  const section = await screen.findByRole("region", { name: "댓글" });
  expect(await within(section).findByText("댓글이 없습니다.")).toBeInTheDocument();
});

test("댓글 조회에 실패해도 글은 보이고 댓글 오류를 보여준다", async () => {
  mockFetch([
    post1Route,
    {
      path: "/api/v1/posts/1/comments",
      status: 500,
      body: { status: 500, error: "Internal Server Error" },
    },
  ]);

  render(<Page />);

  const section = await screen.findByRole("region", { name: "댓글" });
  expect(await within(section).findByRole("alert")).toHaveTextContent(
    "댓글을 불러오지 못했습니다. 500-0 : 요청에 실패했습니다.",
  );
  expect(screen.getByText("제목 : 제목 1")).toBeInTheDocument();
});
