const rates = {
  BDT: 1,
  INR: 1.4,
  PKR: 0.38,
  USD: 110
};

export const convertToBDT = (amount, currency) => {
  const rate = rates[currency] || 1;
  return Number(amount) * rate;
};