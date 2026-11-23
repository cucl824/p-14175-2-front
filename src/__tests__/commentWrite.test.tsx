import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Activity } from "react";
import { expect, test, vi } from "vitest";
import Page from "@/app/posts/[id]/page";
import { mockFetch } from "./fetchMock";
import { makeComment, makePost, postDetailRoutes } from "./fixtures";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const detailRoutes = postDetailRoutes(makePost(1), [makeComment(1, { content: "댓글 1-1" })]);
const writeSuccess = {
  method: "POST",
  path: "/api/v1/posts/1/comments",
  status: 201,
  body: {
    resultCode: "201-1",
    msg: "5번 댓글이 작성되었습니다.",
    data: makeComment(5, { content: "새 댓글" }),
  },
};

async function commentsSection() {
  const section = await screen.findByRole("region", { name: "댓글" });
  await within(section).findByText("댓글 1-1");
  return section;
}

function writeComment(section: HTMLElement, content: string) {
  fireEvent.change(within(section).getByLabelText("댓글 내용"), { target: { value: content } });
  fireEvent.click(within(section).getByRole("button", { name: "댓글 작성" }));
}

test("댓글을 작성하면 목록 끝에 추가하고 입력칸을 비운다", async () => {
  const fetchMock = mockFetch([...detailRoutes, writeSuccess]);

  render(<Page />);
  const section = await commentsSection();
  writeComment(section, "  새 댓글 ");

  expect(await within(section).findByText("새 댓글")).toBeInTheDocument();
  expect(within(section).getByLabelText("댓글 내용")).toHaveValue("");
  const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
  expect(JSON.parse(String(post?.[1]?.body))).toEqual({ content: "새 댓글" });
  const items = within(section).getAllByRole("listitem");
  expect(items.at(-1)).toHaveTextContent("새 댓글");
});

test("댓글이 2자 미만이면 요청하지 않고 안내한다", async () => {
  const fetchMock = mockFetch(detailRoutes);

  render(<Page />);
  const section = await commentsSection();
  writeComment(section, " a ");

  expect(await within(section).findByText("댓글을 2자 이상 입력해주세요.")).toBeInTheDocument();
  expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
});

test("댓글이 100자를 넘으면 요청하지 않고 안내한다", async () => {
  const fetchMock = mockFetch(detailRoutes);

  render(<Page />);
  const section = await commentsSection();
  writeComment(section, "가".repeat(101));

  expect(await within(section).findByText("댓글은 100자 이하로 입력해주세요.")).toBeInTheDocument();
  expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
});

test("댓글 작성 중에는 버튼을 막아 중복 요청을 보내지 않는다", async () => {
  const fetchMock = mockFetch([...detailRoutes, writeSuccess]);

  render(<Page />);
  const section = await commentsSection();
  writeComment(section, "새 댓글");
  const button = within(section).getByRole("button", { name: "댓글 작성" });

  expect(button).toBeDisabled();
  fireEvent.click(button);
  await within(section).findByText("새 댓글");
  expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
});

test("댓글 작성에 실패하면 입력을 남기고 오류를 보여준다", async () => {
  mockFetch([
    ...detailRoutes,
    {
      method: "POST",
      path: "/api/v1/posts/1/comments",
      status: 400,
      body: { resultCode: "400-1", msg: "content-Size-크기가 2에서 100 사이여야 합니다" },
    },
  ]);

  render(<Page />);
  const section = await commentsSection();
  writeComment(section, "새 댓글");

  expect(await within(section).findByRole("alert")).toHaveTextContent(
    "댓글을 작성하지 못했습니다. content-Size-크기가 2에서 100 사이여야 합니다",
  );
  expect(within(section).getByLabelText("댓글 내용")).toHaveValue("새 댓글");
  await waitFor(() =>
    expect(within(section).getByRole("button", { name: "댓글 작성" })).toBeEnabled(),
  );
});

test("다른 화면에 다녀오면 댓글 입력칸이 비어 있다", async () => {
  // cacheComponents에서는 떠난 페이지가 Activity로 숨겨졌다가 다시 보인다.
  mockFetch(detailRoutes);
  const { rerender } = render(
    <Activity mode="visible">
      <Page />
    </Activity>,
  );
  const section = await commentsSection();
  fireEvent.change(within(section).getByLabelText("댓글 내용"), { target: { value: "쓰다 만 댓글" } });

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

  const again = await commentsSection();
  expect(within(again).getByLabelText("댓글 내용")).toHaveValue("");
});

test("댓글이 없던 글에 첫 댓글을 작성하면 목록에 보인다", async () => {
  mockFetch([...postDetailRoutes(makePost(1)), writeSuccess]);

  render(<Page />);
  const section = await screen.findByRole("region", { name: "댓글" });
  await within(section).findByText("댓글이 없습니다.");
  writeComment(section, "새 댓글");

  expect(await within(section).findByText("새 댓글")).toBeInTheDocument();
  expect(within(section).queryByText("댓글이 없습니다.")).not.toBeInTheDocument();
});
