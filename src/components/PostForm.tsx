"use client";

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api";

export type PostFormValues = { title: string; content: string };

type Field = keyof PostFormValues;
type FieldErrors = Partial<Record<Field, string>>;

// 백엔드 PostWriteReqBody/PostModifyReqBody의 @NotBlank @Size 제약과 같은 범위
const LIMITS: Record<Field, { label: string; min: number; max: number }> = {
  title: { label: "제목", min: 2, max: 100 },
  content: { label: "내용", min: 2, max: 5000 },
};
const FIELDS: Field[] = ["title", "content"];

/** 앞뒤 공백을 뺀 값으로 검사한다. 제출도 공백을 뺀 값으로 한다. */
function validate(values: PostFormValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of FIELDS) {
    const { label, min, max } = LIMITS[field];
    const length = values[field].length;
    if (length < min) errors[field] = `${label}을 ${min}자 이상 입력해주세요.`;
    else if (length > max) errors[field] = `${label}은 ${max}자 이하로 입력해주세요.`;
  }
  return errors;
}

type Props = {
  initialValues?: PostFormValues;
  submitLabel: string;
  /** 성공하면 이동 등 후속 처리까지 맡는다. 실패하면 Error를 던진다. */
  onSubmit: (values: PostFormValues) => Promise<void>;
};

const EMPTY: PostFormValues = { title: "", content: "" };

export default function PostForm({ initialValues = EMPTY, submitLabel, onSubmit }: Props) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<Partial<Record<Field, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  // cacheComponents에서는 떠난 페이지가 Activity로 숨겨진다.
  // 숨겨질 때 양식을 처음 상태로 되돌려, 다시 왔을 때 지난 입력이나 잠긴 버튼이 남지 않게 한다.
  useLayoutEffect(() => {
    return () => {
      setValues(initialValues);
      setFieldErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
    };
  }, [initialValues]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = { title: values.title.trim(), content: values.content.trim() };
    const errors = validate(trimmed);
    setFieldErrors(errors);
    const firstInvalid = FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      inputRefs.current[firstInvalid]?.focus();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(trimmed);
    } catch (err) {
      setSubmitError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  const fieldProps = (field: Field) => ({
    name: field,
    value: values[field],
    onChange: (e: { target: { value: string } }) => setValues({ ...values, [field]: e.target.value }),
    "aria-invalid": fieldErrors[field] !== undefined,
    "aria-describedby": fieldErrors[field] ? `post-${field}-error` : undefined,
    className: "border p-1",
  });

  const fieldError = (field: Field) => (
    <div id={`post-${field}-error`} aria-live="polite" className="text-red-600">
      {fieldErrors[field]}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <label className="flex flex-col">
        {LIMITS.title.label}
        <input
          ref={(el) => {
            inputRefs.current.title = el;
          }}
          {...fieldProps("title")}
        />
      </label>
      {fieldError("title")}

      <label className="flex flex-col">
        {LIMITS.content.label}
        <textarea
          ref={(el) => {
            inputRefs.current.content = el;
          }}
          rows={10}
          {...fieldProps("content")}
        />
      </label>
      {fieldError("content")}

      {submitError !== null && (
        <div role="alert" className="text-red-600">
          {submitLabel}하지 못했습니다. {submitError}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className="border p-1 disabled:opacity-50">
        {submitLabel}
      </button>
    </form>
  );
}
