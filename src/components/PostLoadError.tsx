import Link from "next/link";

export default function PostLoadError({ error }: { error: string }) {
  return (
    <>
      <div role="alert" className="text-red-600">
        글을 불러오지 못했습니다. {error}
      </div>
      <Link href="/posts">목록으로</Link>
    </>
  );
}
