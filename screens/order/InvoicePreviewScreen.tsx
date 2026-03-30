import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { generateInvoiceFromOrder, InvoiceData, TransactionItem } from '../../services/api/invoiceService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'InvoicePreview'>;
type RouteProp = { params: { orderData: any } };

const InvoicePreviewScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute() as unknown as RouteProp;
  const { theme } = useTheme();
  const { user } = useAuth(); // Get current logged-in user
  const { orderData } = route.params || {};
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (orderData) {
      // Get customer name from logged-in user profile if not in orderData
      let customerName = orderData.customerName;
      if (!customerName && user) {
        // Combine firstName and lastName from user profile
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        customerName = `${firstName} ${lastName}`.trim();
        // If still empty, use mobile number as fallback
        if (!customerName) {
          customerName = user.mobile || 'Customer';
        }
      }
      
      // Add customer name to orderData if missing
      const orderDataWithCustomer = {
        ...orderData,
        customerName: customerName || orderData.customerName || 'Customer',
      };
      
      const invoice = generateInvoiceFromOrder(orderDataWithCustomer);
      console.log('📄 Invoice data generated:', JSON.stringify(invoice, null, 2));
      console.log('📄 Store ID in invoice:', invoice.storeId);
      console.log('👤 Customer name:', customerName || orderData.customerName || 'Customer');
      setInvoiceData(invoice);
    }
  }, [orderData, user]);

  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Convert number to words (Indian numbering system)
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convertHundreds = (n: number): string => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result.trim();
    };
    
    let words = '';
    const numStr = Math.floor(num).toString();
    
    // Handle crore
    if (numStr.length > 7) {
      const crores = Math.floor(num / 10000000);
      words += convertHundreds(crores) + ' Crore ';
      num %= 10000000;
    }
    
    // Handle lakh
    if (numStr.length > 5) {
      const lakhs = Math.floor(num / 100000);
      words += convertHundreds(lakhs) + ' Lakh ';
      num %= 100000;
    }
    
    // Handle thousand
    if (numStr.length > 3) {
      const thousands = Math.floor(num / 1000);
      words += convertHundreds(thousands) + ' Thousand ';
      num %= 1000;
    }
    
    // Handle hundreds, tens, ones
    words += convertHundreds(Math.floor(num));
    
    // Handle paise (decimal part)
    const paise = Math.round((num - Math.floor(num)) * 100);
    if (paise > 0) {
      words += ' and ' + convertHundreds(paise) + ' Paise';
    }
    
    return words.trim();
  };

  const handleDownload = async () => {
    if (!invoiceData) return;

    try {
      setIsGenerating(true);
      
      // Generate HTML for PDF
      const htmlContent = generateInvoiceHTML(invoiceData);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Create filename with order number and date
      const invoiceDate = new Date(invoiceData.orderDate);
      const dateStr = invoiceDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `Invoice_${invoiceData.orderNumber || 'N/A'}_${dateStr}.pdf`;
      
      // Get directory path - use type assertion since type definitions may be incomplete
      // The properties exist at runtime in expo-file-system
      const fs = FileSystem as any;
      const cacheDir = fs.cacheDirectory || fs.documentDirectory;
      if (!cacheDir) {
        // If no directory available, use the original URI from Print
        console.log('📄 Using original PDF URI:', uri);
        // Share the original URI directly
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: Platform.OS === 'android' ? 'Save Invoice to Downloads' : 'Save Invoice',
            UTI: 'com.adobe.pdf',
          });
          Alert.alert(
            'Invoice Ready',
            'Invoice has been generated. Use the share menu to save it to your Downloads folder.',
            [{ text: 'OK' }]
          );
          return;
        }
        throw new Error('No directory available and sharing not available');
      }
      
      const destinationUri = cacheDir + filename;
      
      // Copy the PDF to the cache directory
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri,
      });
      
      console.log('📄 Invoice saved to:', destinationUri);
      
      // Automatically open share dialog so user can save to Downloads or share
      // On Android, users can select "Save to Downloads" from the share menu
      // On iOS, users can save to Files app
      // This allows the file to be downloaded to the device's Downloads folder
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(destinationUri, {
            mimeType: 'application/pdf',
            dialogTitle: Platform.OS === 'android' ? 'Save Invoice to Downloads' : 'Save Invoice',
            UTI: 'com.adobe.pdf', // iOS UTI for PDF
          });
          
          // Show success message after sharing
          setTimeout(() => {
            Alert.alert(
              'Invoice Ready',
              'Invoice has been generated. Use the share menu to save it to your Downloads folder or share it with others.',
              [{ text: 'OK' }]
            );
          }, 500);
        } else {
          Alert.alert(
            'Download Complete',
            `Invoice has been saved.\n\nLocation: ${destinationUri}`,
            [{ text: 'OK' }]
          );
        }
      } catch (shareError) {
        console.error('Error sharing invoice:', shareError);
        Alert.alert(
          'Invoice Saved',
          `Invoice has been saved to the app directory.\n\nYou can access it from: ${destinationUri}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', `Failed to generate invoice: ${error.message || 'Please try again.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateInvoiceHTML = (invoice: InvoiceData): string => {
    const invoiceDate = new Date(invoice.orderDate);
    const formattedDate = invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const totalAmount = typeof invoice.totalAmount === 'string' ? parseFloat(invoice.totalAmount) : invoice.totalAmount;
    const totalTax = typeof invoice.totalTax === 'string' ? parseFloat(invoice.totalTax) : invoice.totalTax;
    const totalDiscount = typeof invoice.totalDiscount === 'string' ? parseFloat(invoice.totalDiscount) : invoice.totalDiscount;
    const subtotal = Math.max(0, totalAmount - totalTax - totalDiscount);
    const taxPercent = subtotal > 0 ? ((totalTax / subtotal) * 100).toFixed(2) : '0.00';
    const amountInWords = numberToWords(totalAmount);
    
    // Display store name properly
    const storeName = invoice.storeName || 'Store';
    // Check if store name has pattern like "HAMZA MEDICINE CENTER SHOP-328" or similar
    // Split only if there's a clear SHOP pattern
    const shopPattern = /\b(SHOP|SHOP-)\s*(\d+)\b/i;
    const shopMatch = storeName.match(shopPattern);
    
    let storeMainName = storeName;
    let shopNumber = '';
    
    if (shopMatch) {
      // Extract shop number if pattern found
      shopNumber = shopMatch[2] || '';
      // Remove shop pattern from store name
      storeMainName = storeName.replace(shopPattern, '').trim();
      // Clean up any extra spaces or dashes
      storeMainName = storeMainName.replace(/\s+-\s*$/, '').trim();
    }
    
    // If no shop pattern, just use the store name as-is
    if (!shopNumber) {
      storeMainName = storeName;
    }
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 15px; font-size: 11px; }
          .invoice-container { width: 100%; max-width: 800px; margin: 0 auto; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; position: relative; }
          .invoice-title-section { flex: 1; text-align: center; }
          .invoice-title { font-size: 20px; font-weight: bold; color: #008080; margin: 10px 0; }
          .store-info { width: 40%; text-align: right; }
          .store-name { color: #008080; font-weight: bold; font-size: 12px; margin-bottom: 2px; }
          .shop-number { color: #666; font-size: 10px; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .invoice-to { width: 45%; }
          .invoice-to-label { color: #666; font-size: 10px; margin-bottom: 5px; }
          .customer-name { color: #008080; font-weight: bold; font-size: 12px; }
          .invoice-meta { width: 45%; text-align: right; }
          .invoice-meta-row { color: #008080; font-size: 10px; margin-bottom: 3px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px; }
          .items-table th { background-color: #008080; color: white; padding: 8px 4px; text-align: center; font-weight: bold; border: 1px solid #006666; }
          .items-table td { padding: 6px 4px; text-align: center; border: 1px solid #ddd; }
          .items-table tr:nth-child(even) { background-color: #f9f9f9; }
          .product-name { text-align: left; padding-left: 6px; }
          .summary-section { display: flex; justify-content: flex-end; margin-top: 20px; }
          .summary-box { width: 250px; }
          .summary-row { display: flex; justify-content: space-between; padding: 5px 10px; font-size: 11px; }
          .summary-label { color: #333; }
          .summary-value { color: #333; font-weight: 500; }
          .total-row { border-top: 2px solid #ddd; margin-top: 5px; padding-top: 8px; }
          .total-label { font-weight: bold; font-size: 13px; }
          .total-value { font-weight: bold; font-size: 13px; }
          .amount-words { margin-top: 20px; font-size: 11px; color: #333; }
          .amount-words-label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header with Title and Store Info -->
          <div class="invoice-header">
            <div class="invoice-title-section">
              <div class="invoice-title">TAX INVOICE</div>
            </div>
            <div class="store-info">
              ${storeMainName ? `<div class="store-name">${storeMainName.toUpperCase()}</div>` : ''}
              ${shopNumber ? `<div class="shop-number">SHOP-${shopNumber}</div>` : ''}
            </div>
          </div>

          <!-- Invoice Details: Invoice To and Invoice Meta -->
          <div class="invoice-details">
            <div class="invoice-to">
              <div class="invoice-to-label">INVOICE TO</div>
              <div class="customer-name">${invoice.customerName || 'Customer'}</div>
            </div>
            <div class="invoice-meta">
              <div class="invoice-meta-row">Invoice Date:- ${formattedDate}</div>
              <div class="invoice-meta-row">Invoice No.:- ${invoice.orderNumber || 'N/A'}</div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 4%;">S.No.</th>
                <th style="width: 25%;">Product Name</th>
                <th style="width: 6%;">Qty</th>
                <th style="width: 8%;">Mrp</th>
                <th style="width: 8%;">Rate</th>
                <th style="width: 6%;">Dis%</th>
                <th style="width: 6%;">Tax%</th>
                <th style="width: 8%;">Tax</th>
                <th style="width: 8%;">Batch</th>
                <th style="width: 8%;">Expiry</th>
                <th style="width: 13%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, index) => {
                const mrp = parseFloat(item.mrp || '0');
                const rate = parseFloat(item.billrate || '0');
                const qty = parseFloat(item.qty || '0');
                const disPercent = parseFloat(item.disc1percentamt || '0');
                const taxPercent = parseFloat(item.tax || '0');
                const tax = parseFloat(item.taxamount || '0');
                const batch = item.batchno || '-';
                const expiry = item.expiry || '-';
                const amount = parseFloat(item.amount || '0');
                
                return '<tr>' +
                  '<td>' + (index + 1) + '</td>' +
                  '<td class="product-name">' + (item.proname || 'Product') + '</td>' +
                  '<td>' + qty + '</td>' +
                  '<td>' + formatCurrency(mrp) + '</td>' +
                  '<td>' + formatCurrency(rate) + '</td>' +
                  '<td>' + disPercent + '</td>' +
                  '<td>' + taxPercent + '</td>' +
                  '<td>' + formatCurrency(tax) + '</td>' +
                  '<td>' + batch + '</td>' +
                  '<td>' + expiry + '</td>' +
                  '<td>' + formatCurrency(amount) + '</td>' +
                  '</tr>';
              }).join('')}
            </tbody>
          </table>

          <!-- Summary Section -->
          <div class="summary-section">
            <div class="summary-box">
              <div class="summary-row">
                <span class="summary-label">Sub Total</span>
                <span class="summary-value">${formatCurrency(subtotal)}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Tax (%)</span>
                <span class="summary-value">(+)${formatCurrency(totalTax)}</span>
              </div>
              <div class="summary-row total-row">
                <span class="summary-label total-label">Total</span>
                <span class="summary-value total-value">${formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <!-- Amount in Words -->
          <div class="amount-words">
            <span class="amount-words-label">Rs. ${amountInWords}</span>
          </div>

          ${invoice.paymentStatus ? `<div style="margin-top: 20px; font-size: 11px;"><strong>Payment Status:</strong> ${invoice.paymentStatus.toUpperCase()}</div>` : ''}
          ${invoice.paymentMode ? `<div style="font-size: 11px;"><strong>Payment Mode:</strong> ${invoice.paymentMode.toUpperCase()}</div>` : ''}
        </div>
      </body>
      </html>
    `;
  };

  if (!invoiceData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Invoice Preview</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={{ color: theme.colors.secondary }}>Loading invoice...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Invoice Preview</Text>
        // move the download button a bit left side by 10px
        {/* <TouchableOpacity
          onPress={handleDownload}
          style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}
          disabled={isGenerating}
        >
          <MaterialIcons name="download" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>
            {isGenerating ? 'Generating...' : 'Download'}
          </Text>
        </TouchableOpacity> */}
      </View>

      <ScrollView style={styles.content}>
        {/* Invoice Header */}
        <View style={[styles.invoiceHeader, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.invoiceTitle, { color: theme.colors.text }]}>INVOICE</Text>
          <Text style={[styles.orderNumber, { color: theme.colors.secondary }]}>
            Order Number: {invoiceData.orderNumber}
          </Text>
        </View>

        {/* Order Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          {/* Order Date */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>Order Date:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text, fontWeight: '600' }]}>
              {new Date(invoiceData.orderDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          
          {/* Store Name */}
          {invoiceData.storeName && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>Store Name:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text, fontWeight: '600' }]}>
                {invoiceData.storeName}
              </Text>
            </View>
          )}
          
          {/* Store ID - Always show if available */}
          {invoiceData.storeId && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>Store ID:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13 }]}>
                {invoiceData.storeId}
              </Text>
            </View>
          )}
          
          {/* Delivery Address */}
          {invoiceData.customerAddress && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>Delivery Address:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {invoiceData.customerAddress}
              </Text>
            </View>
          )}
          
          {/* Delivery Method */}
          {invoiceData.deliveryMethod && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>Delivery Method:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {invoiceData.deliveryMethod}
              </Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={[styles.tableCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.tableHeaderText, { color: theme.colors.text, flex: 2 }]}>Item</Text>
            <Text style={[styles.tableHeaderText, { color: theme.colors.text, flex: 1 }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { color: theme.colors.text, flex: 1 }]}>Rate</Text>
            <Text style={[styles.tableHeaderText, { color: theme.colors.text, flex: 1 }]}>Amount</Text>
          </View>

          {invoiceData.items.map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 0 && { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.tableCell, { color: theme.colors.text, flex: 2 }]} numberOfLines={2}>
                {item.proname}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, flex: 1 }]}>{item.qty}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, flex: 1 }]}>
                {formatCurrency(item.billrate)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, flex: 1 }]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={[styles.totalCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Subtotal:</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>
              {formatCurrency(Math.max(0, invoiceData.totalAmount - invoiceData.totalTax - invoiceData.totalDiscount))}
            </Text>
          </View>
          {invoiceData.totalDiscount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Discount:</Text>
              <Text style={[styles.totalValue, { color: '#4CAF50' }]}>
                -{formatCurrency(invoiceData.totalDiscount)}
              </Text>
            </View>
          )}
          {invoiceData.totalTax > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Tax:</Text>
              <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                {formatCurrency(invoiceData.totalTax)}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={[styles.grandTotalLabel, { color: theme.colors.text }]}>Total:</Text>
            <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
              {formatCurrency(invoiceData.totalAmount)}
            </Text>
          </View>

          {invoiceData.paymentStatus && (
            <View style={[styles.totalRow, { marginTop: 10 }]}>
              <Text style={[styles.totalLabel, { color: theme.colors.secondary }]}>Payment Status:</Text>
              <Text style={[styles.totalValue, { 
                color: invoiceData.paymentStatus === 'paid' ? '#4CAF50' : 
                       invoiceData.paymentStatus === 'pending' ? '#FF9800' : '#F44336' 
              }]}>
                {invoiceData.paymentStatus.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Download invoice section */}
        <View style={[styles.totalCard, { backgroundColor: theme.colors.surface, marginBottom: 58 }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
              Download Invoice:
            </Text>
            <TouchableOpacity
              onPress={handleDownload}
              style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}
              disabled={isGenerating}
            >
              <MaterialIcons name="download" size={20} color="#fff" />
              <Text style={styles.downloadButtonText}>
                {isGenerating ? 'Generating...' : 'Download'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceHeader: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  tableCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tableCell: {
    fontSize: 14,
    textAlign: 'center',
  },
  totalCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#ddd',
    paddingTop: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default InvoicePreviewScreen;

