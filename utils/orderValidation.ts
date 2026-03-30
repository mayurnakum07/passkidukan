/**
 * Validates that all cart items are present in the selected store and have sufficient quantity.
 * Used for both grocery and pharmacy orders before placing order.
 */
import { storeProductService } from '../services/api/storeProductService';

export interface CartItemForValidation {
  productId: string;
  quantity: number;
  name?: string;
}

export interface ValidateCartResult {
  valid: boolean;
  invalidItems: string[];
  message?: string;
}

export async function validateCartItemsForStore(
  storeId: string | undefined,
  cartType: 'grocery' | 'pharma',
  items: CartItemForValidation[]
): Promise<ValidateCartResult> {
  const invalidItems: string[] = [];

  if (!storeId) {
    return {
      valid: false,
      invalidItems: [],
      message: 'No store selected. Please select a store before placing the order.',
    };
  }

  if (!items || items.length === 0) {
    return {
      valid: false,
      invalidItems: [],
      message: 'Your cart is empty.',
    };
  }

  for (const item of items) {
    const productId = item.productId;
    const requestedQty = item.quantity || 1;
    const displayName = item.name || 'Unknown Product';

    if (!productId) {
      invalidItems.push(displayName + ' (invalid product)');
      continue;
    }

    try {
      const response =
        cartType === 'pharma'
          ? await storeProductService.getPharmaProductDetails(storeId, productId)
          : await storeProductService.getGroceryProductDetails(storeId, productId);

      if (!response.success || !response.data) {
        invalidItems.push(`${displayName} (does not belong to this ${cartType === 'pharma' ? 'pharmacy' : 'grocery'} store)`);
        continue;
      }

      const product = response.data;
      const availableQty = product.availableQty ?? 0;
      const isAvailable = product.isAvailable !== false && availableQty > 0;

      if (!isAvailable) {
        invalidItems.push(`${displayName} (out of stock in this store)`);
        continue;
      }

      if (availableQty < requestedQty) {
        invalidItems.push(
          `${displayName} (requested: ${requestedQty}, available: ${availableQty})`
        );
      }
    } catch (_) {
      invalidItems.push(`${displayName} (could not verify in this store)`);
    }
  }

  return {
    valid: invalidItems.length === 0,
    invalidItems,
    message:
      invalidItems.length > 0
        ? `Some items do not belong to the selected ${cartType === 'pharma' ? 'pharmacy' : 'grocery'} store. Please remove them or change store: ${invalidItems.join('; ')}`
        : undefined,
  };
}
