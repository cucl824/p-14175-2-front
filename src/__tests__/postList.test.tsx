import { render, screen } from "@testing-library/react";
import { Activity } from "react";
import { expect, test, vi } from "vitest";
import Page from "@/app/posts/page";
import { mockFetch } from "./fetchMock";
import { makePost } from "./fixtures";

test("글 목록을 불러오는 동안 로딩을 보여주고, 제목을 상세 링크로 보여준다", async () => {
  mockFetch([{ path: "/api/v1/posts", body: [makePost(1), makePost(2)] }]);

  render(<Page />);

  expect(screen.getByText("로딩중...")).toBeInTheDocument();
  const link = await screen.findByRole("link", { name: "제목 2" });
  expect(link.getAttribute("href")).toBe("/posts/2");
  expect(screen.getByRole("link", { name: "제목 1" }).getAttribute("href")).toBe("/posts/1");
  expect(screen.queryByText("로딩중...")).toBeNull();
});

test("글이 하나도 없으면 빈 목록 안내를 보여준다", async () => {
  mockFetch([{ path: "/api/v1/posts", body: [] }]);

  render(<Page />);

  expect(await screen.findByText("글이 없습니다.")).toBeInTheDocument();
  expect(screen.queryByText("로딩중...")).toBeNull();
});

test("목록 조회에 실패하면 오류를 보여준다", async () => {
  // 백엔드에 500 처리기가 없어 Spring 기본 오류 본문(msg 없음)이 온다.
  mockFetch([
    {
      path: "/api/v1/posts",
      status: 500,
      body: { status: 500, error: "Internal Server Error", path: "/api/v1/posts" },
    },
  ]);

  render(<Page />);

  expect(await screen.findByRole("alert")).toHaveTextContent("요청에 실패했습니다. (500)");
  expect(screen.queryByText("로딩중...")).not.toBeInTheDocument();
});

test("서버에 연결할 수 없으면 연결 오류를 보여준다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

  render(<Page />);

  expect(await screen.findByRole("alert")).toHaveTextContent("서버에 연결할 수 없습니다.");
});

test("다른 화면에 다녀오면 예전 목록 대신 새로 조회한 목록을 보여준다", async () => {
  // cacheComponents에서는 떠난 페이지가 Activity로 숨겨졌다가 다시 보인다.
  mockFetch([{ path: "/api/v1/posts", body: [makePost(1), makePost(2)] }]);
  const { rerender } = render(
    <Activity mode="visible">
      <Page />
    </Activity>,
  );
  await screen.findByRole("link", { name: "제목 2" });

  rerender(
    <Activity mode="hidden">
      <Page />
    </Activity>,
  );
  mockFetch([{ path: "/api/v1/posts", body: [makePost(1)] }]);
  rerender(
    <Activity mode="visible">
      <Page />
    </Activity>,
  );

  expect(screen.queryByRole("link", { name: "제목 2" })).not.toBeInTheDocument();
  expect(await screen.findByRole("link", { name: "제목 1" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "제목 2" })).not.toBeInTheDocument();
});

test("글 쓰기 화면으로 가는 링크가 있다", async () => {
  mockFetch([{ path: "/api/v1/posts", body: [] }]);

  render(<Page />);

  expect(screen.getByRole("link", { name: "글 쓰기" })).toHaveAttribute("href", "/posts/write");
  await screen.findByText("글이 없습니다.");
});

test("백엔드가 오류 응답을 주면 resultCode와 msg를 함께 보여준다", async () => {
  mockFetch([
    { path: "/api/v1/posts", status: 400, body: { resultCode: "400-1", msg: "잘못된 요청입니다." } },
  ]);

  render(<Page />);

  expect(await screen.findByRole("alert")).toHaveTextContent("400-1 : 잘못된 요청입니다.");
});
