import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import Page from "@/app/posts/[id]/page";
import { API_BASE_URL } from "@/lib/api";
import { mockFetch } from "./fetchMock";
import { makePost } from "./fixtures";

const router = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => router,
}));

const post1 = makePost(1);

test("삭제를 확인하면 글을 삭제하고 목록으로 이동한다", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = mockFetch([
    { path: "/api/v1/posts/1", body: post1 },
    {
      method: "DELETE",
      path: "/api/v1/posts/1",
      body: { resultCode: "200-1", msg: "1번 글이 삭제되었습니다.", data: null },
    },
  ]);

  render(<Page />);
  fireEvent.click(await screen.findByRole("button", { name: "삭제" }));

  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/posts"));
  expect(fetchMock).toHaveBeenCalledWith(
    `${API_BASE_URL}/api/v1/posts/1`,
    expect.objectContaining({ method: "DELETE" }),
  );
});

test("삭제를 취소하면 요청을 보내지 않는다", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const fetchMock = mockFetch([{ path: "/api/v1/posts/1", body: post1 }]);

  render(<Page />);
  fireEvent.click(await screen.findByRole("button", { name: "삭제" }));

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(router.replace).not.toHaveBeenCalled();
});

test("삭제 중에는 버튼을 막아 중복 요청을 보내지 않는다", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = mockFetch([
    { path: "/api/v1/posts/1", body: post1 },
    { method: "DELETE", path: "/api/v1/posts/1", body: { resultCode: "200-1", msg: "1번 글이 삭제되었습니다.", data: null } },
  ]);

  render(<Page />);
  const button = await screen.findByRole("button", { name: "삭제" });
  fireEvent.click(button);
  fireEvent.click(button);

  expect(button).toBeDisabled();
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  const deletes = fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE");
  expect(deletes).toHaveLength(1);
});

test("삭제에 실패하면 오류를 보여주고 다시 시도할 수 있다", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  mockFetch([
    { path: "/api/v1/posts/1", body: post1 },
    {
      method: "DELETE",
      path: "/api/v1/posts/1",
      status: 404,
      body: { resultCode: "404-1", msg: "해당 데이터가 존재하지 않습니다." },
    },
  ]);

  render(<Page />);
  fireEvent.click(await screen.findByRole("button", { name: "삭제" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("해당 데이터가 존재하지 않습니다.");
  expect(screen.getByRole("button", { name: "삭제" })).toBeEnabled();
  expect(router.replace).not.toHaveBeenCalled();
});
