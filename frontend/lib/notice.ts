export interface SucsfbidMthdNmParts {
  primary: string | null;
  detail: string | null;
}

/**
 * 나라장터 낙찰방법 문자열을 첫 번째 하이픈(-)을 기준으로 분리한다.
 * "소액수의견적-소액수의견적(2인 이상 견적 제출)-국민연금보험료 등" →
 * { primary: "소액수의견적", detail: "소액수의견적(2인 이상 견적 제출)-국민연금보험료 등" }
 */
export function splitSucsfbidMthdNm(value: string | null | undefined): SucsfbidMthdNmParts {
  if (!value || value.trim() === '') {
    return { primary: null, detail: null };
  }

  const trimmed = value.trim();
  const hyphenIdx = trimmed.indexOf('-');

  if (hyphenIdx === -1) {
    return { primary: trimmed, detail: null };
  }

  const primary = trimmed.slice(0, hyphenIdx).trim();
  const detail = trimmed.slice(hyphenIdx + 1).trim();

  if (!primary) {
    return { primary: trimmed, detail: null };
  }

  if (!detail || detail === primary) {
    return { primary, detail: null };
  }

  return { primary, detail };
}
