"use client";

import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { apiFetch, errorMessage, type PostCommentDto, type RsData } from "@/lib/api";
import { lengthError } from "@/lib/validation";

// 백엔드 PostCommentWriteReqBody: @NotBlank @Size(min = 2, max = 100) content
const CONTENT_MIN = 2;
const CONTENT_MAX = 100;

type Props = {
  postId: number;
  onWritten: (comment: PostCommentDto) => void;
};

export default function CommentForm({ postId, onWritten }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 화면이 숨겨질 때마다 바뀐다. 숨겨지기 전에 보낸 요청의 결과는 양식에 반영하지 않는다.
  const generationRef = useRef(0);

  // cacheComponents에서 화면이 Activity로 숨겨질 때 입력과 오류를 비운다.
  useLayoutEffect(() => {
    const generation = generationRef;
    return () => {
      generation.current += 1;
      setContent("");
      setFieldError(null);
      setSubmitError(null);
      setIsSubmitting(false);
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = content.trim();
    const error = lengthError("댓글", trimmed, CONTENT_MIN, CONTENT_MAX);
    setFieldError(error);
    if (error !== null) {
      inputRef.current?.focus();
      return;
    }

    const generation = generationRef.current;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const rsData = await apiFetch<RsData<PostCommentDto>>(`/api/v1/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: trimmed }),
      });
      // 목록 반영은 양식이 숨겨졌어도 한다(목록 쪽에서 중복을 거른다).
      onWritten(rsData.data);
      if (generation !== generationRef.current) return;
      setContent("");
    } catch (err) {
      if (generation !== generationRef.current) return;
      setSubmitError(errorMessage(err));
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2 mt-2">
      <label htmlFor={inputId}>댓글 내용</label>
      <textarea
        ref={inputRef}
        id={inputId}
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        aria-invalid={fieldError !== null}
        aria-describedby={fieldError !== null ? `${inputId}-error` : undefined}
        className="border p-1"
      />
      <div id={`${inputId}-error`} aria-live="polite" className="text-red-600">
        {fieldError}
      </div>

      {submitError !== null && (
        <div role="alert" className="text-red-600">
          댓글을 작성하지 못했습니다. {submitError}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className="border p-1 disabled:opacity-50">
        댓글 작성
      </button>
    </form>
  );
}
