// utils/priceFormatter.ts
// Utility function to format prices consistently across the app

export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0.00';
  }
  
  // Format to 2 decimal places, removing trailing zeros
  return numPrice.toFixed(2).replace(/\.?0+$/, '');
};

export const formatPriceWithSymbol = (price: number | string, symbol: string = '₹'): string => {
  return `${symbol}${formatPrice(price)}`;
};

export const formatPriceWithCurrency = (price: number | string): string => {
  return formatPriceWithSymbol(price, '₹');
};
