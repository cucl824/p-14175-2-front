"use client";

import Link from "next/link";

export default function Page() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center gap-4">
      <div>안녕하세요.</div>
      <Link href="/posts" className="p-2 rounded border hover:bg-gray-100">
        글 목록 보기
      </Link>
    </div>
  );
}
