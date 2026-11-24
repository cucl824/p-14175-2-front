"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { errorMessage, type PostCommentDto } from "@/lib/api";
import type { usePostComments } from "@/lib/usePostComments";
import { lengthError } from "@/lib/validation";

// 훅의 반환 타입을 그대로 써서 하위 컴포넌트마다 타입을 다시 적지 않는다.
type PostCommentsState = ReturnType<typeof usePostComments>;

// 백엔드 PostCommentWriteReqBody: @NotBlank @Size(min = 2, max = 100) content
const CONTENT_MIN = 2;
const CONTENT_MAX = 100;

function PostCommentWrite({ postCommentsState }: { postCommentsState: PostCommentsState }) {
  const { writeComment } = postCommentsState;
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
      // 목록 반영은 양식이 숨겨졌어도 한다(훅에서 중복을 거른다).
      await writeComment(trimmed);
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

function PostCommentListItem({
  postComment,
  postCommentsState,
}: {
  postComment: PostCommentDto;
  postCommentsState: PostCommentsState;
}) {
  // 강의(43강)처럼 훅의 함수 이름 앞에 _를 붙이고, 같은 이름으로 확인 단계를 감싼 함수를 만든다.
  const { deleteComment: _deleteComment, modifyComment } = postCommentsState;
  const contentId = useId();
  // 삭제 진행·오류는 댓글마다 따로 가지므로 다른 댓글에 영향을 주지 않는다.
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // 수정 모드도 댓글마다 따로 가진다.
  const modifyInputId = useId();
  const [modifyMode, setModifyMode] = useState(false);
  const [modifyContent, setModifyContent] = useState(postComment.content);
  const [modifyFieldError, setModifyFieldError] = useState<string | null>(null);
  const [modifyError, setModifyError] = useState<string | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const modifyInputRef = useRef<HTMLTextAreaElement>(null);
  const modifyToggleRef = useRef<HTMLButtonElement>(null);
  // 저장에 성공하면 사라진 저장 버튼 대신 수정 버튼으로 포커스를 돌려준다.
  const returnFocusRef = useRef(false);

  useEffect(() => {
    if (!modifyMode && !isModifying && returnFocusRef.current) {
      returnFocusRef.current = false;
      modifyToggleRef.current?.focus();
    }
  }, [modifyMode, isModifying]);

  const deleteComment = async () => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // 성공하면 목록에서 빠지면서 이 컴포넌트도 사라진다.
      await _deleteComment(postComment.id);
    } catch (err) {
      setDeleteError(`댓글을 삭제하지 못했습니다. ${errorMessage(err)}`);
      setIsDeleting(false);
    }
  };

  const toggleModifyMode = () => {
    // 열 때마다 지금 댓글 내용으로 다시 채운다.
    if (!modifyMode) {
      setModifyContent(postComment.content);
      setModifyFieldError(null);
      setModifyError(null);
    }
    setModifyMode(!modifyMode);
  };

  const handleModifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = modifyContent.trim();
    const error = lengthError("댓글", trimmed, CONTENT_MIN, CONTENT_MAX);
    setModifyFieldError(error);
    if (error !== null) {
      modifyInputRef.current?.focus();
      return;
    }

    setIsModifying(true);
    setModifyError(null);

    try {
      await modifyComment(postComment.id, trimmed);
      returnFocusRef.current = true;
      setModifyMode(false);
    } catch (err) {
      // 수정 폼과 입력은 그대로 두어 다시 시도할 수 있게 한다.
      setModifyError(`댓글을 수정하지 못했습니다. ${errorMessage(err)}`);
    }
    setIsModifying(false);
  };

  return (
    <li className="flex flex-col gap-1">
      <div className="flex gap-2 items-start">
        {!modifyMode && (
          <span id={contentId} className="whitespace-pre-line">
            {postComment.content}
          </span>
        )}

        {modifyMode && (
          <form onSubmit={handleModifySubmit} noValidate className="flex flex-col gap-1">
            <div className="flex gap-2 items-start">
              <label htmlFor={modifyInputId} className="sr-only">
                댓글 수정 내용
              </label>
              <textarea
                ref={modifyInputRef}
                id={modifyInputId}
                name="content"
                value={modifyContent}
                onChange={(e) => setModifyContent(e.target.value)}
                rows={3}
                autoFocus
                aria-invalid={modifyFieldError !== null}
                aria-describedby={modifyFieldError !== null ? `${modifyInputId}-error` : undefined}
                className="border p-1"
              />
              <button
                type="submit"
                disabled={isModifying}
                className="border p-1 disabled:opacity-50"
              >
                저장
              </button>
            </div>
            <div id={`${modifyInputId}-error`} aria-live="polite" className="text-red-600">
              {modifyFieldError}
            </div>
            {modifyError !== null && (
              <div role="alert" className="text-red-600">
                {modifyError}
              </div>
            )}
          </form>
        )}

        <button
          ref={modifyToggleRef}
          type="button"
          onClick={toggleModifyMode}
          disabled={isModifying || isDeleting}
          aria-label={modifyMode ? "댓글 수정취소" : "댓글 수정"}
          className="disabled:opacity-50"
        >
          {modifyMode ? "수정취소" : "수정"}
        </button>
        <button
          type="button"
          onClick={deleteComment}
          disabled={isDeleting || isModifying}
          aria-label="댓글 삭제"
          aria-describedby={modifyMode ? undefined : contentId}
          className="disabled:opacity-50"
        >
          삭제
        </button>
      </div>

      {deleteError !== null && (
        <div role="alert" className="text-red-600">
          {deleteError}
        </div>
      )}
    </li>
  );
}

function PostCommentList({ postCommentsState }: { postCommentsState: PostCommentsState }) {
  const { postComments, error } = postCommentsState;

  if (error !== null)
    return (
      <div role="alert" className="text-red-600">
        댓글을 불러오지 못했습니다. {error}
      </div>
    );

  if (postComments === null) return <div>댓글 로딩중...</div>;

  if (postComments.length === 0) return <div>댓글이 없습니다.</div>;

  return (
    <ul>
      {postComments.map((postComment) => (
        <PostCommentListItem
          key={postComment.id}
          postComment={postComment}
          postCommentsState={postCommentsState}
        />
      ))}
    </ul>
  );
}

export default function PostCommentWriteAndList({
  postCommentsState,
}: {
  postCommentsState: PostCommentsState;
}) {
  // 숨겨진 이전 글 화면이 함께 남아 있을 수 있어 id가 겹치지 않게 한다.
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="mt-4">
      <h2 id={headingId}>댓글</h2>

      <PostCommentList postCommentsState={postCommentsState} />

      {postCommentsState.postComments !== null && (
        <PostCommentWrite postCommentsState={postCommentsState} />
      )}
    </section>
  );
}
