import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriceBlockProps {
  price?: number | string;
  originalPrice?: number | string;
  perUnit?: string; // e.g., "500g", "₹33.4/100 g"
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatAmount = (value: unknown): string => {
  const n = toNumber(value);
  return n.toFixed(2);
};

const PriceBlock: React.FC<PriceBlockProps> = ({ price, originalPrice, perUnit }) => {
  const priceNum = toNumber(price);
  const originalNum = toNumber(originalPrice);

  const percentOff =
    originalPrice !== undefined && originalNum > priceNum
      ? Math.round(((originalNum - priceNum) / originalNum) * 100)
      : null;
  const hasDiscount = percentOff !== null && percentOff > 0;

  return (
    <View style={styles.container}>
      {hasDiscount && (
        <View style={styles.percentOffTag}>
          <Text style={styles.percentOffText}>{percentOff}% OFF</Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.price}>₹{formatAmount(priceNum)}</Text>
        {hasDiscount && (
          <Text style={styles.mrp}>₹{formatAmount(originalNum)}</Text>
        )}
      </View>
      {perUnit && (
        <Text style={styles.perUnit}>{perUnit}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    padding: 0,
    margin: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  price: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A7B50', // Blinkit green
    marginRight: 5,
  },
  mrp: {
    fontSize: 10,
    color: '#888',
    textDecorationLine: 'line-through',
    marginRight: 5,
    fontWeight: '500',
  },
  percentOffTag: {
    backgroundColor: '#E6F4EA', // light green
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    marginBottom: 1,
  },
  percentOffText: {
    color: '#1A7B50',
    fontWeight: 'bold',
    fontSize: 9,
    letterSpacing: 0.1,
  },
  perUnit: {
    fontSize: 9,
    color: '#888',
    marginTop: 1,
    fontWeight: '400',
  },
});

export default PriceBlock; 