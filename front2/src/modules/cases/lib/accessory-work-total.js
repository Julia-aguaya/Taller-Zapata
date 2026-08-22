const toAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getAccessoryWorkTotals = (accessoryUi) => {
  if (accessoryUi?.enabled !== 'SI') return { labor: 0, parts: 0, quoted: 0 };

  const { labor, parts } = (accessoryUi.works ?? []).reduce(
    (totals, work) => ({
      labor: totals.labor + toAmount(work.amount),
      parts: totals.parts + (work.includesReplacement === 'SI' ? toAmount(work.replacementAmount) : 0),
    }),
    { labor: 0, parts: 0 },
  );
  return { labor, parts, quoted: labor + parts };
};

export const getAccessoryWorkTotal = (accessoryUi) => getAccessoryWorkTotals(accessoryUi).quoted;
