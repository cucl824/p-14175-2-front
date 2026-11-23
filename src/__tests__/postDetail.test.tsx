import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import Page from "@/app/posts/[id]/page";
import { mockFetch } from "./fetchMock";
import { makePost } from "./fixtures";

const params = vi.hoisted(() => ({ id: "1" }));

vi.mock("next/navigation", () => ({
  useParams: () => params,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const post1 = makePost(1, { content: "내용 1\n둘째 줄" });

beforeEach(() => {
  params.id = "1";
});

test("URL의 id로 글을 조회해 번호·제목·본문을 보여준다", async () => {
  mockFetch([{ path: "/api/v1/posts/1", body: post1 }]);

  render(<Page />);

  expect(screen.getByText("로딩중...")).toBeInTheDocument();
  expect(await screen.findByText("제목 : 제목 1")).toBeInTheDocument();
  expect(screen.getByText("번호 : 1")).toBeInTheDocument();
  expect(screen.getByText(/내용 1/)).toHaveTextContent("내용 1 둘째 줄");
  expect(screen.getByRole("link", { name: "목록으로" })).toHaveAttribute("href", "/posts");
});

test("없는 글이면 오류와 목록 링크를 보여준다", async () => {
  mockFetch([
    {
      path: "/api/v1/posts/1",
      status: 404,
      body: { resultCode: "404-1", msg: "해당 데이터가 존재하지 않습니다." },
    },
  ]);

  render(<Page />);

  expect(await screen.findByRole("alert")).toHaveTextContent("해당 데이터가 존재하지 않습니다.");
  expect(screen.queryByText("로딩중...")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "목록으로" })).toHaveAttribute("href", "/posts");
});

test("글 번호가 숫자가 아니면 요청 없이 오류를 보여준다", async () => {
  params.id = "abc";
  const fetchMock = mockFetch([]);

  render(<Page />);

  expect(await screen.findByRole("alert")).toHaveTextContent("잘못된 글 번호입니다.");
  expect(fetchMock).not.toHaveBeenCalled();
});
