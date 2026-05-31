import { prisma } from '../db';

export class PrintService {
  /**
   * Generates a KOT for newly added items only.
   * Marks items as printed after generation.
   */
  async generateKOT(orderId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch the order with only unprinted items
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          table: true,
          items: {
            where: { isPrinted: false }
          }
        }
      });

      if (!order || order.items.length === 0) {
        return { success: false, message: 'No new items to print.' };
      }

      // 2. Logic for Thermal Printing (Placeholder for ESC/POS command generation)
      const kotContent = this.formatKOT(order);
      console.log('--- THERMAL KOT PRINTING ---');
      console.log(kotContent);
      console.log('---------------------------');

      // 3. Mark items as printed
      const itemIds = order.items.map(item => item.id);
      await tx.orderItem.updateMany({
        where: { id: { in: itemIds } },
        data: { 
          isPrinted: true,
          syncStatus: 'PENDING',
          version: { increment: 1 }
        }
      });

      return { success: true, content: kotContent };
    });
  }

  private formatKOT(order: any) {
    const date = new Date().toLocaleString();
    let content = `KOT: ${order.id}\nTable: ${order.table?.name || 'N/A'}\nTime: ${date}\n\n`;
    content += `ITEM                QTY\n`;
    content += `-----------------------\n`;
    order.items.forEach((item: any) => {
      const name = item.menuItem.padEnd(20);
      content += `${name}${item.qty}\n`;
      if (item.modifiers) {
        content += `  * ${item.modifiers}\n`;
      }
    });
    content += `-----------------------\n`;
    return content;
  }

  /**
   * Generates a full Invoice for the order.
   * Type: 'PRO_FORMA' (Before payment) or 'FINAL' (After payment).
   */
  async generateInvoice(orderId: string, type: 'PRO_FORMA' | 'FINAL') {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: true,
        restaurant: true
      }
    });

    if (!order) throw new Error('Order not found');

    const invoiceContent = this.formatInvoice(order, type);
    console.log(`--- ${type} INVOICE PRINTING ---`);
    console.log(invoiceContent);
    console.log('-------------------------------');

    if (type === 'FINAL') {
       // Mark order as Settled or similar if not already
       await prisma.order.update({
         where: { id: orderId },
         data: { status: 'SETTLED', syncStatus: 'PENDING', version: { increment: 1 } }
       });
    }

    return { success: true, content: invoiceContent };
  }

  private formatInvoice(order: any, type: 'PRO_FORMA' | 'FINAL') {
    const restaurant = order.restaurant?.name || 'RestroOS';
    const date = new Date().toLocaleString();
    const WIDTH = 42;
    const center = (str: string) => str.padStart((WIDTH + str.length) / 2).padEnd(WIDTH);
    const line = '-'.repeat(WIDTH);

    let content = `\n${center(restaurant)}\n`;
    content += `${center(type + ' INVOICE')}\n`;
    content += `${line}\n`;
    content += `Date: ${date}\n`;
    content += `Table: ${order.table?.name || 'N/A'}\n`;
    content += `Order ID: ${order.id.split('-')[0]}\n`;
    content += `${line}\n`;
    content += `ITEM                QTY    PRICE     TOTAL\n`;
    content += `${line}\n`;
    
    order.items.forEach((item: any) => {
      const name = item.menuItem.substring(0, 18).padEnd(19);
      const qty = item.qty.toString().padStart(3).padEnd(6);
      const price = item.price.toString().padStart(8).padEnd(10);
      const rowTotal = (item.price * item.qty).toString().padStart(7);
      content += `${name}${qty}${price}${rowTotal}\n`;
    });

    content += `${line}\n`;
    content += `Subtotal`.padEnd(30) + `₹${order.subtotal.toFixed(2).padStart(10)}\n`;
    content += `Tax`.padEnd(30) + `₹${order.tax.toFixed(2).padStart(10)}\n`;
    content += `${line}\n`;
    content += `TOTAL`.padEnd(30) + `₹${order.total.toFixed(2).padStart(10)}\n`;
    content += `${line}\n`;
    
    if (type === 'FINAL') {
      content += `\n${center('THANK YOU FOR VISITING!')}\n`;
      content += `${center('RSK SOLUTIONS')}\n\n`;
    } else {
      content += `\n${center('*** THIS IS NOT A BILL ***')}\n`;
      content += `${center('PRELIMINARY CHECK')}\n\n`;
    }
    
    return content;
  }
}

export const printService = new PrintService();
