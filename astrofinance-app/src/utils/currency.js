// Utilidades para formateo de moneda chilena (CLP)

export const formatCurrency = (amount) => {
  // Validar que el amount sea un número válido
  const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(validAmount);
};

export const formatCurrencyWithDecimals = (amount) => {
  // Validar que el amount sea un número válido
  const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(validAmount);
};

export const formatAmount = (amount, type) => {
  const formattedAmount = formatCurrency(amount);
  return type === 'income' ? `+${formattedAmount}` : `-${formattedAmount}`;
};

export const getCurrencySymbol = () => {
  return 'CLP';
};

export const getCurrencyCode = () => {
  return 'CLP';
};
