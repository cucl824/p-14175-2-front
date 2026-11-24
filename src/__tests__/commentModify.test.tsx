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

test("수정을 누르면 기존 내용이 채워진 수정 폼이 열리고, 다른 댓글은 그대로다", async () => {
  mockFetch(detailRoutes);

  render(<Page />);
  const item = await commentItem("댓글 1-1");
  fireEvent.click(within(item).getByRole("button", { name: "댓글 수정" }));

  expect(within(item).getByLabelText("댓글 수정 내용")).toHaveValue("댓글 1-1");
  expect(within(item).getByRole("button", { name: "저장" })).toBeInTheDocument();
  expect(within(item).getByRole("button", { name: "댓글 수정 취소" })).toHaveTextContent("수정취소");

  const other = await commentItem("댓글 1-2");
  expect(within(other).queryByRole("textbox")).not.toBeInTheDocument();
});

test("수정취소를 누르면 요청 없이 원래 내용으로 돌아간다", async () => {
  const fetchMock = mockFetch(detailRoutes);

  render(<Page />);
  const item = await commentItem("댓글 1-1");
  fireEvent.click(within(item).getByRole("button", { name: "댓글 수정" }));
  fireEvent.change(within(item).getByLabelText("댓글 수정 내용"), { target: { value: "바꾸다 만 내용" } });
  fireEvent.click(within(item).getByRole("button", { name: "댓글 수정 취소" }));

  expect(within(item).queryByRole("textbox")).not.toBeInTheDocument();
  expect(within(item).getByText("댓글 1-1")).toBeInTheDocument();
  expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(false);

  // 다시 열면 바꾸다 만 내용이 아니라 원래 내용이 채워져 있다.
  fireEvent.click(within(item).getByRole("button", { name: "댓글 수정" }));
  expect(within(item).getByLabelText("댓글 수정 내용")).toHaveValue("댓글 1-1");
});

const modifySuccess = {
  method: "PUT",
  path: "/api/v1/posts/1/comments/1",
  body: { resultCode: "200-1", msg: "1번 댓글이 수정되었습니다.", data: null },
};

test("저장하면 앞뒤 공백을 뺀 내용으로 수정하고, 새로고침 없이 그 댓글만 바꾼다", async () => {
  const fetchMock = mockFetch([...detailRoutes, modifySuccess]);

  render(<Page />);
  const item = await commentItem("댓글 1-1");
  fireEvent.click(within(item).getByRole("button", { name: "댓글 수정" }));
  fireEvent.change(within(item).getByLabelText("댓글 수정 내용"), { target: { value: "  고친 댓글  " } });
  fireEvent.click(within(item).getByRole("button", { name: "저장" }));

  // 저장이 끝나 수정 폼이 닫힐 때까지 기다린다.
  await waitFor(() => expect(within(item).queryByRole("textbox")).not.toBeInTheDocument());
  expect(within(item).getByText("고친 댓글")).toBeInTheDocument();
  expect(screen.getByText("댓글 1-2")).toBeInTheDocument();

  const puts = fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT");
  expect(puts).toHaveLength(1);
  expect(JSON.parse(String(puts[0][1]?.body))).toEqual({ content: "고친 댓글" });
  // 목록을 다시 조회하지 않는다(글 1번 + 댓글 목록 1번).
  expect(fetchMock.mock.calls.filter(([, init]) => (init?.method ?? "GET") === "GET")).toHaveLength(2);
});

test.each([
  ["", "댓글을 2자 이상 입력해주세요."],
  ["   \n  ", "댓글을 2자 이상 입력해주세요."],
  [" 가 ", "댓글을 2자 이상 입력해주세요."],
])("수정 내용이 %j이면 요청하지 않고 안내한다", async (value, message) => {
  const fetchMock = mockFetch(detailRoutes);

  render(<Page />);
  const item = await commentItem("댓글 1-1");
  fireEvent.click(within(item).getByRole("button", { name: "댓글 수정" }));
  const textarea = within(item).getByLabelText("댓글 수정 내용");
  fireEvent.change(textarea, { target: { value } });
  fireEvent.click(within(item).getByRole("button", { name: "저장" }));

  expect(await within(item).findByText(message)).toBeInTheDocument();
  expect(textarea).toHaveFocus();
  expect(textarea).toHaveAttribute("aria-invalid", "true");
  expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(false);
});

test("저장 중에는 저장 버튼을 막아 중복 요청을 보내지 않는다", async () => {
  const fetchMock = mockFetch([...detailRoutes, modifySuccess]);

  render(<Page />);
  const item = await commentItem("댓글 1-1");
  fireEvent.click(within(item).getByRole("button", { name: "댓글 수정" }));
  fireEvent.change(within(item).getByLabelText("댓글 수정 내용"), { target: { value: "고친 댓글" } });
  const save = within(item).getByRole("button", { name: "저장" });
  fireEvent.click(save);

  expect(save).toBeDisabled();
  fireEvent.click(save);
  await waitFor(() => expect(within(item).queryByRole("textbox")).not.toBeInTheDocument());
  expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT")).toHaveLength(1);
});

test("수정에 실패하면 수정 폼과 입력을 남기고 resultCode·msg로 안내한다", async () => {
  mockFetch([
    ...detailRoutes,
    {
      method: "PUT",
      path: "/api/v1/posts/1/comments/1",
      status: 404,
      body: { resultCode: "404-1", msg: "해당 데이터가 존재하지 않습니다." },
    },
  ]);

  render(<Page />);
  const item = await commentItem("댓글 1-1");
  fireEvent.click(within(item).getByRole("button", { name: "댓글 수정" }));
  fireEvent.change(within(item).getByLabelText("댓글 수정 내용"), { target: { value: "고친 댓글" } });
  fireEvent.click(within(item).getByRole("button", { name: "저장" }));

  expect(await within(item).findByRole("alert")).toHaveTextContent(
    "댓글을 수정하지 못했습니다. 404-1 : 해당 데이터가 존재하지 않습니다.",
  );
  expect(within(item).getByLabelText("댓글 수정 내용")).toHaveValue("고친 댓글");
  expect(within(item).getByRole("button", { name: "저장" })).toBeEnabled();
  expect(screen.getByText("댓글 1-2")).toBeInTheDocument();
});
