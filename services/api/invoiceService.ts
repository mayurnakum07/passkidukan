// Invoice Service - Parses and generates invoice data
// Based on the Java code reference for bill preview transaction parsing

export interface TransactionItem {
  cmpCode: string;
  cmpName: string;
  itemCode: string;
  barcode: string;
  proname: string;
  packing: string;
  manufaturername: string;
  batchno: string;
  expiry: string;
  tax: string;
  defaultrate: string;
  billrate: string;
  cstrecoverable: string;
  mrp: string;
  excisepreunit: string;
  qty: string;
  free: string;
  disc1percentamt: string;
  discountAmount: string;
  disc2percentamt: string;
  taxamount: string;
  amount: string;
  code: string;
  convertBy: string;
  deliveryCharge?: string;
}

export interface InvoiceData {
  header: TransactionItem;
  items: TransactionItem[];
  totalAmount: number;
  totalTax: number;
  totalDiscount: number;
  orderNumber: string;
  orderDate: string;
  storeName?: string;
  storeId?: string;
  customerName?: string;
  customerAddress?: string;
  deliveryMethod?: string;
  paymentStatus?: string;
  paymentMode?: string;
}

// Utility function to replace null with empty string
const repNull = (input: string | null | undefined): string => {
  return input == null ? '' : String(input).trim();
};

// Format date to DD/MM/YYYY
const formatDateDMY = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Try parsing as DD-MM-YYYY or other formats
      return dateString;
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString;
  }
};

/**
 * Parse invoice data from string format
 * Format: "\rT," separated rows, each row is comma-separated values
 * First row is header, rest are items
 */
export const parseInvoiceData = (invoiceString: string): InvoiceData => {
  const billArrayTrans: TransactionItem[] = [];

  try {
    // Create header row
    const header: TransactionItem = {
      cmpCode: 'Company Code',
      cmpName: 'Company Name',
      itemCode: 'Item Code',
      barcode: 'BarCode',
      proname: 'Item Description',
      packing: '',
      manufaturername: 'Manufacture',
      batchno: 'Batch',
      expiry: 'Expiry',
      tax: 'Tax%',
      defaultrate: 'Default Rate',
      billrate: 'Rate',
      cstrecoverable: 'CSR',
      mrp: 'Mrp',
      excisepreunit: 'Exi',
      qty: 'Qty',
      free: '',
      disc1percentamt: 'Dis%',
      discountAmount: 'Discount',
      disc2percentamt: '',
      taxamount: 'Tax',
      amount: 'Amount',
      code: 'Code',
      convertBy: 'ConvertBy',
    };

    billArrayTrans.push(header);

    // Process the invoice string
    const str = repNull(invoiceString.replace(/\rT,/g, 'µ'));
    const count = str.length - str.replace(/µ/g, '').length;
    const splited = str.split('µ');

    for (let c = 1; c <= count; c++) {
      const strSplited = splited[c];
      if (!strSplited) continue;

      const strSeperatedByComma = strSplited.split(',');

      try {
        if (strSeperatedByComma.length < 26) {
          // Skip if not enough columns
          continue;
        }

        const tm: TransactionItem = {
          cmpCode: repNull(strSeperatedByComma[0]),
          cmpName: repNull(strSeperatedByComma[1]),
          itemCode: repNull(strSeperatedByComma[2]),
          barcode: repNull(strSeperatedByComma[3]),
          proname: repNull(strSeperatedByComma[4]),
          packing: repNull(strSeperatedByComma[5]),
          manufaturername: repNull(strSeperatedByComma[6]),
          batchno: repNull(strSeperatedByComma[7]),
          expiry: formatDateDMY(repNull(strSeperatedByComma[8])),
          tax: repNull(strSeperatedByComma[11]),
          defaultrate: repNull(strSeperatedByComma[12]),
          billrate: repNull(strSeperatedByComma[13]),
          cstrecoverable: repNull(strSeperatedByComma[14]),
          mrp: repNull(strSeperatedByComma[15]),
          excisepreunit: repNull(strSeperatedByComma[17]),
          qty: repNull(strSeperatedByComma[19]),
          free: repNull(strSeperatedByComma[20]),
          disc1percentamt: repNull(strSeperatedByComma[21]),
          discountAmount: repNull(strSeperatedByComma[22]),
          disc2percentamt: repNull(strSeperatedByComma[23]),
          amount: repNull(strSeperatedByComma[24]),
          taxamount: repNull(strSeperatedByComma[25]),
          code: '',
          convertBy: repNull(strSeperatedByComma[26]),
        };

        // Process code field (similar to Java code)
        try {
          if (strSeperatedByComma[26]) {
            let code = String(strSeperatedByComma[26]);
            if (code.length >= 4) {
              code = code.substring(4);
              tm.code = repNull(code.replace(/\rF/g, ''));
            } else {
              tm.code = '';
            }
          } else {
            tm.code = '';
          }
        } catch (e) {
          tm.code = '';
        }

        billArrayTrans.push(tm);
      } catch (e) {
        console.error('Error parsing transaction item:', e);
        // Continue with next item
      }
    }

    // Calculate totals
    const items = billArrayTrans.slice(1); // Skip header
    let totalAmount = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach((item) => {
      const amount = parseFloat(item.amount || '0');
      const tax = parseFloat(item.taxamount || '0');
      const discount = parseFloat(item.discountAmount || '0');

      if (!isNaN(amount)) totalAmount += amount;
      if (!isNaN(tax)) totalTax += tax;
      if (!isNaN(discount)) totalDiscount += discount;
    });

    return {
      header,
      items,
      totalAmount,
      totalTax,
      totalDiscount,
      orderNumber: '',
      orderDate: new Date().toISOString(),
    };
  } catch (e) {
    console.error('Error parsing invoice data:', e);
    return {
      header: {} as TransactionItem,
      items: [],
      totalAmount: 0,
      totalTax: 0,
      totalDiscount: 0,
      orderNumber: '',
      orderDate: new Date().toISOString(),
    };
  }
};

/**
 * Generate invoice data from order summary
 */
export const generateInvoiceFromOrder = (orderSummary: any): InvoiceData => {
  // Create header row
  const header: TransactionItem = {
    cmpCode: 'Company Code',
    cmpName: orderSummary.storeName || 'Store Name',
    itemCode: 'Item Code',
    barcode: 'BarCode',
    proname: 'Item Description',
    packing: 'Packing',
    manufaturername: 'Manufacture',
    batchno: 'Batch',
    expiry: 'Expiry',
    tax: 'Tax%',
    defaultrate: 'Default Rate',
    billrate: 'Rate',
    cstrecoverable: 'CSR',
    mrp: 'Mrp',
    excisepreunit: 'Exi',
    qty: 'Qty',
    free: 'Free',
    disc1percentamt: 'Dis%',
    discountAmount: 'Discount',
    disc2percentamt: '',
    taxamount: 'Tax',
    amount: 'Amount',
    code: 'Code',
    convertBy: 'ConvertBy',
  };

  // Transform order items to invoice transaction items
  // Use all the details passed from previous screens (item name, qty, rate, amount)
  const items: TransactionItem[] = (orderSummary.items || []).map((item: any) => {
    // Use passed values if available, otherwise calculate
    const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0); // Rate
    const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 1); // Qty
    // Use amount if already calculated and passed, otherwise calculate it
    const itemAmount = typeof item.amount === 'number' ? item.amount : (typeof item.amount === 'string' ? parseFloat(item.amount) : (price * quantity)); // Amount
    const name = item.name || item.proname || 'Unknown Product'; // Item Name
    
    return {
      cmpCode: orderSummary.storeId || '',
      cmpName: orderSummary.storeName || '',
      itemCode: item.productId || item.id || '',
      barcode: item.id || '',
      proname: name, // Item Name - use passed value
      packing: item.variant?.unit || item.packing || '',
      manufaturername: item.manufacturer || item.manufaturername || '',
      batchno: item.batch || item.batchno || '',
      expiry: item.expiry || '',
      tax: String(item.tax || 0),
      defaultrate: String(price), // Default Rate
      billrate: String(price), // Rate (selling price)
      cstrecoverable: '',
      mrp: String(item.originalPrice || item.mrp || price),
      excisepreunit: '',
      qty: String(quantity), // Qty - use passed value
      free: String(item.free || 0),
      disc1percentamt: String(item.discountPercent || item.disc1percentamt || 0),
      discountAmount: String(item.discount || item.discountAmount || 0),
      disc2percentamt: String(item.disc2percentamt || '0'),
      taxamount: String(item.taxAmount || item.tax || 0),
      amount: String(itemAmount), // Amount - use passed value or calculated
      code: '',
      convertBy: '',
    };
  });

  // Calculate totals
  // Calculate total from items if orderSummary.total is not available or 0
  const calculatedTotal = items.reduce((sum, item) => {
    const itemAmount = parseFloat(item.amount || '0');
    return sum + (isNaN(itemAmount) ? 0 : itemAmount);
  }, 0);
  
  // Use orderSummary.total if available and greater than 0, otherwise calculate from items
  const orderTotal = typeof orderSummary.total === 'string' ? parseFloat(orderSummary.total) : (orderSummary.total || 0);
  const totalAmount = orderTotal > 0 ? orderTotal : calculatedTotal;
  
  // Calculate tax and discount from items
  const totalTax = items.reduce((sum, item) => {
    const tax = parseFloat(item.taxamount || '0');
    return sum + (isNaN(tax) ? 0 : tax);
  }, 0);
  
  const totalDiscount = items.reduce((sum, item) => {
    const discount = parseFloat(item.discountAmount || '0');
    return sum + (isNaN(discount) ? 0 : discount);
  }, 0);

  return {
    header,
    items,
    totalAmount,
    totalTax,
    totalDiscount,
    orderNumber: orderSummary.orderNumber || orderSummary.orderId || orderSummary.id || '',
    // Handle orderDate - convert to ISO format if needed
    orderDate: (() => {
      let dateValue = orderSummary.orderDate || orderSummary.createdAt || new Date().toISOString();
      if (typeof dateValue === 'string') {
        // If it's in DD/MM/YYYY format, convert it
        if (dateValue.includes('/') && dateValue.split('/').length === 3) {
          const [day, month, year] = dateValue.split('/');
          dateValue = new Date(`${year}-${month}-${day}`).toISOString();
        } else if (!dateValue.includes('T')) {
          // Try to parse as is
          const parsed = new Date(dateValue);
          dateValue = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
        }
      }
      return dateValue;
    })(),
    storeName: orderSummary.storeName || 'Store',
    storeId: orderSummary.storeId || '',
    customerName: orderSummary.customerName,
    customerAddress: orderSummary.deliveryAddress || orderSummary.address || orderSummary.customerAddress,
    deliveryMethod: orderSummary.deliveryMethod || orderSummary.orderType || 'Home Delivery',
    paymentStatus: orderSummary.paymentStatus,
    paymentMode: orderSummary.paymentMode,
  };
};

export default {
  parseInvoiceData,
  generateInvoiceFromOrder,
};

