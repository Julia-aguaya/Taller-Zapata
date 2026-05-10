export function addYears(date, years) {
  if (!date || !years) {
    return '';
  }

  const next = new Date(`${date}T12:00:00`);
  next.setFullYear(next.getFullYear() + Number(years));
  return next.toISOString().slice(0, 10);
}
