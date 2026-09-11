const nonNegativeAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

export const deriveUnfavorableFranchiseSettlement = ({ agreedQuote, franchise, amountRequiredByCompany }) => {
  const quote = nonNegativeAmount(agreedQuote);
  const franchiseBalance = Math.max(0, nonNegativeAmount(franchise) - nonNegativeAmount(amountRequiredByCompany));
  const amountToBillCompany = Math.max(0, quote - franchiseBalance);

  return {
    amountToBillCompany,
    customerChargeAmount: Math.max(0, quote - amountToBillCompany),
    quotationInsufficient: quote < franchiseBalance,
  };
};
