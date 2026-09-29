const pad = (n: number) => String(n).padStart(2, "0");

/** 以使用者本地時區取得今天的 YYYY-MM-DD。 */
export const todayISO = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const currentMonthKey = (): string => todayISO().slice(0, 7);

export const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  if (!y || !m || !d) return value;
  return `${y}/${m}/${d}`;
};

export const formatDateShort = (value?: string | null): string => {
  if (!value) return "—";
  const [, m, d] = value.slice(0, 10).split("-");
  if (!m || !d) return value;
  return `${Number(m)}/${Number(d)}`;
};

export const monthKeyOf = (value?: string | null): string =>
  value ? value.slice(0, 7) : currentMonthKey();

export const monthLabel = (key: string): string => {
  const [y, m] = key.split("-");
  return `${y} 年 ${Number(m)} 月`;
};

export const shiftMonthKey = (key: string, delta: number): string => {
  const [y, m] = key.split("-").map(Number);
  const shifted = new Date(y, m - 1 + delta, 1);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}`;
};

/** 回傳該月份的起訖日期（含頭尾），用於資料庫日期區間查詢。 */
export const monthBounds = (key: string): { start: string; end: string } => {
  const [y, m] = key.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { start: `${key}-01`, end: `${key}-${pad(lastDay)}` };
};