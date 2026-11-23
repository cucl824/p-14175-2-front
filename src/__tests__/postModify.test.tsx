import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import Page from "@/app/posts/[id]/modify/page";
import { mockFetch } from "./fetchMock";
import { makePost } from "./fixtures";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const params = vi.hoisted(() => ({ id: "1" }));

vi.mock("next/navigation", () => ({
  useParams: () => params,
  useRouter: () => router,
}));

const getPost1 = { path: "/api/v1/posts/1", body: makePost(1, { title: "원래 제목", content: "원래 내용" }) };
const modifySuccess = {
  method: "PUT",
  path: "/api/v1/posts/1",
  body: { resultCode: "200-1", msg: "1번 글이 수정되었습니다.", data: null },
};

beforeEach(() => {
  params.id = "1";
});

test("기존 제목과 내용이 채워진 양식을 보여준다", async () => {
  mockFetch([getPost1]);

  render(<Page />);

  expect(screen.getByText("로딩중...")).toBeInTheDocument();
  expect(await screen.findByLabelText("제목")).toHaveValue("원래 제목");
  expect(screen.getByLabelText("내용")).toHaveValue("원래 내용");
  expect(screen.getByRole("link", { name: "취소" })).toHaveAttribute("href", "/posts/1");
});

test("수정하면 PUT 요청을 보내고 글 상세로 이동한다", async () => {
  const fetchMock = mockFetch([getPost1, modifySuccess]);

  render(<Page />);
  fireEvent.change(await screen.findByLabelText("제목"), { target: { value: "바뀐 제목" } });
  fireEvent.change(screen.getByLabelText("내용"), { target: { value: "바뀐 내용" } });
  fireEvent.click(screen.getByRole("button", { name: "수정" }));

  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/posts/1"));
  const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
  expect(JSON.parse(String(put?.[1]?.body))).toEqual({ title: "바뀐 제목", content: "바뀐 내용" });
});

test("입력값이 올바르지 않으면 요청하지 않고 안내한다", async () => {
  const fetchMock = mockFetch([getPost1]);

  render(<Page />);
  fireEvent.change(await screen.findByLabelText("제목"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "수정" }));

  expect(await screen.findByText("제목을 2자 이상 입력해주세요.")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("수정 중에는 버튼을 막아 중복 요청을 보내지 않는다", async () => {
  const fetchMock = mockFetch([getPost1, modifySuccess]);

  render(<Page />);
  const button = await screen.findByRole("button", { name: "수정" });
  fireEvent.click(button);

  expect(button).toBeDisabled();
  fireEvent.click(button);
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT")).toHaveLength(1);
});

test("수정에 실패하면 오류를 보여주고 다시 시도할 수 있다", async () => {
  mockFetch([
    getPost1,
    {
      method: "PUT",
      path: "/api/v1/posts/1",
      status: 404,
      body: { resultCode: "404-1", msg: "해당 데이터가 존재하지 않습니다." },
    },
  ]);

  render(<Page />);
  fireEvent.click(await screen.findByRole("button", { name: "수정" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("해당 데이터가 존재하지 않습니다.");
  expect(screen.getByRole("button", { name: "수정" })).toBeEnabled();
  expect(router.replace).not.toHaveBeenCalled();
});

test("없는 글이면 양식 대신 오류를 보여준다", async () => {
  mockFetch([
    {
      path: "/api/v1/posts/1",
      status: 404,
      body: { resultCode: "404-1", msg: "해당 데이터가 존재하지 않습니다." },
    },
  ]);

  render(<Page />);

  expect(await screen.findByRole("alert")).toHaveTextContent("해당 데이터가 존재하지 않습니다.");
  expect(screen.queryByLabelText("제목")).not.toBeInTheDocument();
});

test("글 번호가 숫자가 아니면 요청 없이 오류를 보여준다", async () => {
  params.id = "abc";
  const fetchMock = mockFetch([]);

  render(<Page />);

  expect(await screen.findByRole("alert")).toHaveTextContent("잘못된 글 번호입니다.");
  expect(fetchMock).not.toHaveBeenCalled();
});
