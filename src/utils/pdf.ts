import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

/**
 * Generates and shares a PDF from bill text or HTML content
 * Uses expo-print to create PDF from the bill text returned by n8n workflow
 */
export const generatePDF = async (
  billContent: string,
  fileName: string = "invoice.pdf",
  isHtml: boolean = false
): Promise<void> => {
  try {
    console.log("[PDF] Generating PDF for:", fileName);

    let htmlContent: string;

    if (isHtml) {
      // If content is already HTML, use it as is
      htmlContent = billContent;
    } else {
      // Convert plain text bill to HTML
      htmlContent = convertTextToHTML(billContent);
    }

    // Generate PDF using expo-print
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    console.log("[PDF] PDF generated at:", uri);

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Invoice",
        UTI: "com.adobe.pdf",
      });
      console.log("[PDF] PDF shared successfully");
    } else {
      Alert.alert(
        "PDF Generated",
        `Your invoice has been generated but sharing is not available on this device. PDF saved at: ${uri}`
      );
    }
  } catch (error) {
    console.error("[PDF] Error generating PDF:", error);
    Alert.alert("Error", "Failed to generate PDF. Please try again.");
    throw error;
  }
};

/**
 * Converts plain text bill content to formatted HTML
 */
const convertTextToHTML = (textContent: string): string => {
  // Escape HTML characters
  const escapeHtml = (text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  // Convert line breaks to HTML and add basic styling
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          margin: 20px;
          background-color: white;
        }
        .invoice-header {
          text-align: center;
          margin-bottom: 20px;
          font-weight: bold;
        }
        .invoice-content {
          white-space: pre-wrap;
          background-color: #f9f9f9;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <h2>Inventory Management System</h2>
        <p>Invoice</p>
      </div>
      <div class="invoice-content">${textContent.replace(/\n/g, "<br>")}</div>
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

/**
 * Generates a formatted HTML invoice from order data
 */
export const generateHTMLInvoice = (
  customerName: string,
  customerEmail: string,
  orderId: string,
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>,
  grandTotal: number,
  orderDate: string = new Date().toLocaleString()
): string => {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${
        item.quantity
      }</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(
        2
      )}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.total.toFixed(
        2
      )}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${orderId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: white;
        }
        .invoice-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .invoice-title {
          font-size: 18px;
          color: #666;
        }
        .customer-details {
          margin-bottom: 20px;
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
        }
        .order-details {
          margin-bottom: 20px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background-color: #333;
          color: white;
          padding: 12px 8px;
          text-align: left;
        }
        .items-table th:nth-child(2),
        .items-table th:nth-child(3),
        .items-table th:nth-child(4) {
          text-align: center;
        }
        .items-table th:nth-child(3),
        .items-table th:nth-child(4) {
          text-align: right;
        }
        .total-section {
          text-align: right;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #333;
        }
        .grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="company-name">Inventory Management System</div>
        <div class="invoice-title">Invoice</div>
      </div>
      
      <div class="customer-details">
        <h3 style="margin-top: 0; color: #333;">Customer Details</h3>
        <p><strong>Name:</strong> ${customerName}</p>
        ${
          customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ""
        }
      </div>
      
      <div class="order-details">
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Date:</strong> ${orderDate}</p>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="grand-total">
          Grand Total: $${grandTotal.toFixed(2)}
        </div>
      </div>
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>This invoice was generated automatically on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Preview bill content before generating PDF
 */
export const previewBill = async (
  billContent: string,
  isHtml: boolean = false
): Promise<void> => {
  try {
    let htmlContent: string;

    if (isHtml) {
      htmlContent = billContent;
    } else {
      htmlContent = convertTextToHTML(billContent);
    }

    // Use expo-print to show print preview
    await Print.printAsync({
      html: htmlContent,
    });
  } catch (error) {
    console.error("[PDF] Error previewing bill:", error);
    Alert.alert("Error", "Failed to preview bill. Please try again.");
    throw error;
  }
};
