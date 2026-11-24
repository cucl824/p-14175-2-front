import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import Page from "@/app/posts/[id]/page";
import { mockFetch } from "./fetchMock";
import { makeComment, makePost, postDetailRoutes } from "./fixtures";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const detailRoutes = postDetailRoutes(makePost(1), [
  makeComment(1, { content: "댓글 1-1" }),
  makeComment(2, { content: "댓글 1-2" }),
]);

async function commentItem(content: string) {
  const section = await screen.findByRole("region", { name: "댓글" });
  return (await within(section).findByText(content)).closest("li") as HTMLElement;
}

test("댓글 삭제를 확인하면 삭제하고 목록에서 뺀다", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = mockFetch([
    ...detailRoutes,
    {
      method: "DELETE",
      path: "/api/v1/posts/1/comments/1",
      body: { resultCode: "200-1", msg: "1번 댓글이 삭제되었습니다.", data: null },
    },
  ]);

  render(<Page />);
  fireEvent.click(within(await commentItem("댓글 1-1")).getByRole("button", { name: "댓글 삭제" }));

  await waitFor(() => expect(screen.queryByText("댓글 1-1")).not.toBeInTheDocument());
  expect(screen.getByText("댓글 1-2")).toBeInTheDocument();
  expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE")).toHaveLength(1);
});

test("댓글 삭제를 취소하면 요청을 보내지 않는다", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const fetchMock = mockFetch(detailRoutes);

  render(<Page />);
  fireEvent.click(within(await commentItem("댓글 1-1")).getByRole("button", { name: "댓글 삭제" }));

  expect(screen.getByText("댓글 1-1")).toBeInTheDocument();
  expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);
});

test("댓글 삭제 중에는 그 댓글의 삭제 버튼을 막는다", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = mockFetch([
    ...detailRoutes,
    { method: "DELETE", path: "/api/v1/posts/1/comments/1", body: { resultCode: "200-1", msg: "삭제" } },
  ]);

  render(<Page />);
  const button = within(await commentItem("댓글 1-1")).getByRole("button", { name: "댓글 삭제" });
  fireEvent.click(button);

  expect(button).toBeDisabled();
  fireEvent.click(button);
  await waitFor(() => expect(screen.queryByText("댓글 1-1")).not.toBeInTheDocument());
  expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE")).toHaveLength(1);
});

test("댓글 삭제에 실패하면 댓글을 남기고 오류를 보여준다", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  mockFetch([
    ...detailRoutes,
    {
      method: "DELETE",
      path: "/api/v1/posts/1/comments/1",
      status: 404,
      body: { resultCode: "404-1", msg: "해당 데이터가 존재하지 않습니다." },
    },
  ]);

  render(<Page />);
  const item = await commentItem("댓글 1-1");
  fireEvent.click(within(item).getByRole("button", { name: "댓글 삭제" }));

  const section = screen.getByRole("region", { name: "댓글" });
  expect(await within(section).findByRole("alert")).toHaveTextContent(
    "댓글을 삭제하지 못했습니다. 404-1 : 해당 데이터가 존재하지 않습니다.",
  );
  expect(screen.getByText("댓글 1-1")).toBeInTheDocument();
  expect(within(item).getByRole("button", { name: "댓글 삭제" })).toBeEnabled();
});
