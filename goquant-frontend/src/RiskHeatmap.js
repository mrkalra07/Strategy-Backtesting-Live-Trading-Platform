const computeMonthlyReturns = (equity) => {
  const grouped = {};
  for (let i = 1; i < equity.length; i++) {
    const prev = equity[i - 1].equity;
    const curr = equity[i].equity;
    const date = new Date(equity[i].date);
    const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
    grouped[month] = ((curr - prev) / prev) * 100;
  }
  return Object.entries(grouped).map(([month, val]) => ({ month, return: val }));
};
