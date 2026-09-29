export const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** 台幣金額顯示，整數不顯示小數。 */
export const formatMoney = (value: unknown): string => {
  const n = toNumber(value);
  return `NT$${n.toLocaleString("zh-TW", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

/** 只輸出數字部分，前端再自行搭配 NT$ 前綴排版。 */
export const formatAmount = (value: unknown): string =>
  toNumber(value).toLocaleString("zh-TW", {
    minimumFractionDigits: Number.isInteger(toNumber(value)) ? 0 : 2,
    maximumFractionDigits: 2,
  });

export const formatQty = (value: unknown): string => {
  const n = toNumber(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};