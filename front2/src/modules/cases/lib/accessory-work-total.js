const toAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getAccessoryWorkTotals = (accessoryUi) => {
  if (accessoryUi?.enabled !== 'SI') return { labor: 0, parts: 0, vat: 0, quoted: 0 };

  const { labor, parts } = (accessoryUi.works ?? []).reduce(
    (totals, work) => ({
      labor: totals.labor + toAmount(work.amount),
      parts: totals.parts + (work.includesReplacement === 'SI' ? toAmount(work.replacementAmount) : 0),
    }),
    { labor: 0, parts: 0 },
  );
  const vat = labor * 0.21;
  return { labor, parts, vat, quoted: labor + vat + parts };
};

export const getAccessoryWorkTotal = (accessoryUi) => getAccessoryWorkTotals(accessoryUi).quoted;
