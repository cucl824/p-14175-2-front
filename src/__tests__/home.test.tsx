import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Page from "@/app/page";

test("홈 화면에 인사말과 글 목록으로 가는 링크가 보인다", () => {
  render(<Page />);

  expect(screen.getByText("안녕하세요.")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "글 목록 보기" }).getAttribute("href"),
  ).toBe("/posts");
});
