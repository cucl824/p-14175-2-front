import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Activity } from "react";
import { expect, test, vi } from "vitest";
import Page from "@/app/posts/write/page";
import { mockFetch } from "./fetchMock";
import { makePost } from "./fixtures";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

function fillForm(title: string, content: string) {
  fireEvent.change(screen.getByLabelText("제목"), { target: { value: title } });
  fireEvent.change(screen.getByLabelText("내용"), { target: { value: content } });
}

const writeSuccess = {
  method: "POST",
  path: "/api/v1/posts",
  status: 201,
  body: {
    resultCode: "201-1",
    msg: "7번 글이 작성되었습니다.",
    data: makePost(7, { title: "새 제목", content: "새 내용" }),
  },
};

test("제목과 내용을 입력해 작성하면 새 글 상세로 이동한다", async () => {
  const fetchMock = mockFetch([writeSuccess]);

  render(<Page />);
  fillForm("새 제목", "새 내용");
  fireEvent.click(screen.getByRole("button", { name: "작성" }));

  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/posts/7"));
  const [, init] = fetchMock.mock.calls[0];
  expect(init?.method).toBe("POST");
  expect(JSON.parse(String(init?.body))).toEqual({ title: "새 제목", content: "새 내용" });
});

test("제목이나 내용이 2자 미만이면 요청하지 않고 안내한다", async () => {
  const fetchMock = mockFetch([]);

  render(<Page />);
  fillForm(" a ", "   ");
  fireEvent.click(screen.getByRole("button", { name: "작성" }));

  expect(await screen.findByText("제목을 2자 이상 입력해주세요.")).toBeInTheDocument();
  expect(screen.getByText("내용을 2자 이상 입력해주세요.")).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("제목이 100자를 넘으면 요청하지 않고 안내한다", async () => {
  const fetchMock = mockFetch([]);

  render(<Page />);
  fillForm("가".repeat(101), "내용입니다");
  fireEvent.click(screen.getByRole("button", { name: "작성" }));

  expect(await screen.findByText("제목은 100자 이하로 입력해주세요.")).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("작성 중에는 버튼을 막아 중복 요청을 보내지 않는다", async () => {
  const fetchMock = mockFetch([writeSuccess]);

  render(<Page />);
  fillForm("새 제목", "새 내용");
  const button = screen.getByRole("button", { name: "작성" });
  fireEvent.click(button);
  fireEvent.click(button);

  expect(button).toBeDisabled();
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("서버가 거절하면 오류를 보여주고 다시 작성할 수 있다", async () => {
  mockFetch([
    {
      method: "POST",
      path: "/api/v1/posts",
      status: 400,
      body: { resultCode: "400-1", msg: "title-Size-크기가 2에서 100 사이여야 합니다" },
    },
  ]);

  render(<Page />);
  fillForm("새 제목", "새 내용");
  fireEvent.click(screen.getByRole("button", { name: "작성" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("크기가 2에서 100 사이여야 합니다");
  expect(screen.getByRole("button", { name: "작성" })).toBeEnabled();
  expect(router.replace).not.toHaveBeenCalled();
});

test("작성을 마치고 다시 글 쓰기에 오면 빈 양식이 보인다", async () => {
  // cacheComponents에서는 떠난 페이지가 Activity로 숨겨졌다가 다시 보인다.
  mockFetch([writeSuccess]);
  const { rerender } = render(
    <Activity mode="visible">
      <Page />
    </Activity>,
  );
  fillForm("새 제목", "새 내용");
  fireEvent.click(screen.getByRole("button", { name: "작성" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalled());

  rerender(
    <Activity mode="hidden">
      <Page />
    </Activity>,
  );
  rerender(
    <Activity mode="visible">
      <Page />
    </Activity>,
  );

  expect(screen.getByLabelText("제목")).toHaveValue("");
  expect(screen.getByLabelText("내용")).toHaveValue("");
  expect(screen.getByRole("button", { name: "작성" })).toBeEnabled();
});

test("내용이 5000자를 넘으면 요청하지 않고 안내한다", async () => {
  const fetchMock = mockFetch([]);

  render(<Page />);
  fillForm("새 제목", "가".repeat(5001));
  fireEvent.click(screen.getByRole("button", { name: "작성" }));

  expect(await screen.findByText("내용은 5000자 이하로 입력해주세요.")).toBeInTheDocument();
  expect(screen.getByLabelText("내용")).toHaveFocus();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("앞뒤 공백은 빼고 작성한다", async () => {
  const fetchMock = mockFetch([writeSuccess]);

  render(<Page />);
  fillForm("  새 제목  ", "\n새 내용\n");
  fireEvent.click(screen.getByRole("button", { name: "작성" }));

  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/posts/7"));
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
    title: "새 제목",
    content: "새 내용",
  });
});

test("서버에 연결할 수 없으면 연결 오류를 보여준다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

  render(<Page />);
  fillForm("새 제목", "새 내용");
  fireEvent.click(screen.getByRole("button", { name: "작성" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("서버에 연결할 수 없습니다.");
  expect(screen.getByRole("button", { name: "작성" })).toBeEnabled();
});
