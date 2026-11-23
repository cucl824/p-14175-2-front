import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals를 끄고 있어 Testing Library의 자동 정리가 등록되지 않으므로 직접 정리한다.
afterEach(() => {
  cleanup();
});
