/**
 * 앞뒤 공백을 뺀 값의 길이가 [min, max] 범위를 벗어나면 안내 문구를, 아니면 null을 돌려준다.
 * label은 받침으로 끝나는 말(제목·내용·댓글)을 가정한다.
 */
export function lengthError(label: string, value: string, min: number, max: number): string | null {
  const length = value.trim().length;
  if (length < min) return `${label}을 ${min}자 이상 입력해주세요.`;
  if (length > max) return `${label}은 ${max}자 이하로 입력해주세요.`;
  return null;
}
