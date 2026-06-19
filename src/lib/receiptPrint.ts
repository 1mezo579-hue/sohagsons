import { formatPrice } from "@/lib/utils";

export interface ReceiptInvoice {
  invoiceNo: string;
  createdAt: string;
  orderType?: string;
  total: number;
  discount: number;
  finalTotal: number;
  deliveryFee?: number;
  paymentType?: string;
  customer?: {
    name: string;
    phone?: string;
    address?: string | null;
    points?: number;
    balance?: number;
  } | null;
  items: Array<{
    id?: number;
    quantity: number;
    price?: number;
    total: number;
    product?: { name: string } | null;
  }>;
  riderChange?: number;
  isReprint?: boolean;
}

const THERMAL_CSS = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    width: 74mm;
    max-width: 74mm;
    margin: 0 auto;
    padding: 2mm 4mm;
    color: #111;
    font-size: 12px;
    line-height: 1.35;
  }
  .center { text-align: center; }
  .title { font-size: 16px; font-weight: 900; margin-bottom: 2px; }
  .phones { font-size: 11px; font-weight: 700; color: #333; margin: 2px 0; }
  .badge {
    display: inline-block;
    background: #1d4ed8;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 4px;
    margin: 4px 0;
  }
  .badge-return { background: #be123c; }
  .meta { font-size: 10px; color: #666; margin: 1px 0; }
  .dash { border-top: 1px dashed #bbb; margin: 6px 0; }
  .customer {
    background: #f3f4f6;
    border-radius: 4px;
    padding: 4px 6px;
    margin: 4px 0;
    font-size: 11px;
    font-weight: 700;
  }
  .customer small { display: block; font-weight: 500; font-size: 10px; color: #555; margin-top: 2px; }
  .item { display: flex; justify-content: space-between; gap: 4px; margin: 2px 0; font-size: 12px; }
  .item-name { flex: 1; word-break: break-word; }
  .item-price { white-space: nowrap; font-weight: 600; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 12px; }
  .row.total { font-size: 14px; font-weight: 900; border-top: 1px solid #ccc; padding-top: 4px; margin-top: 4px; }
  .row.highlight { color: #b45309; font-weight: 800; }
  .footer { text-align: center; font-size: 10px; color: #777; margin-top: 6px; padding-top: 4px; border-top: 1px solid #ddd; }
`;

function itemName(item: ReceiptInvoice["items"][0]): string {
  return item.product?.name || "منتج";
}

export function buildReceiptHtml(invoice: ReceiptInvoice): string {
  const isDelivery = invoice.orderType === "delivery";
  const isReturn = invoice.orderType === "return";
  const pointsEarned = Math.floor(Math.abs(invoice.finalTotal) / 10);
  const riderChange = invoice.riderChange || 0;

  const itemsHtml = invoice.items
    .map(
      (item) => `
      <div class="item">
        <span class="item-name">${itemName(item)} × ${item.quantity}</span>
        <span class="item-price">${formatPrice(item.total)}</span>
      </div>`
    )
    .join("");

  let customerHtml = "";
  if (invoice.customer) {
    customerHtml = `
      <div class="customer">
        العميل: ${invoice.customer.name}
        ${invoice.customer.phone ? `<small>📞 ${invoice.customer.phone}</small>` : ""}
        ${invoice.customer.address ? `<small>📍 ${invoice.customer.address}</small>` : ""}
        ${!isReturn ? `<small>⭐ نقاط هذه الفاتورة: ${pointsEarned} نقطة</small>` : ""}
        ${invoice.customer.points != null ? `<small>🏅 رصيد النقاط: ${invoice.customer.points} نقطة</small>` : ""}
        ${(invoice.customer.balance || 0) > 0 ? `<small>💳 رصيد آجل: ${formatPrice(invoice.customer.balance!)}</small>` : ""}
      </div>`;
  }

  const typeBadge = isReturn
    ? `<div class="badge badge-return">↩️ مرتجع</div>`
    : isDelivery
      ? `<div class="badge">🚚 طلب دليفري</div>`
      : `<div class="meta">فاتورة مبيعات</div>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${invoice.invoiceNo}</title>
  <style>${THERMAL_CSS}</style>
</head>
<body>
  <div class="center">
    <div class="title">ماركت أبناء سوهاج</div>
    <div class="phones">035551771 - 01224163621</div>
    <div class="phones">واتس: 01211469399</div>
    ${typeBadge}
    ${invoice.isReprint ? `<div class="meta">(نسخة إعادة طباعة)</div>` : ""}
    <div class="meta" style="font-family:monospace">${invoice.invoiceNo}</div>
    <div class="meta">${new Date(invoice.createdAt).toLocaleString("ar-EG")}</div>
  </div>
  ${customerHtml}
  <div class="dash"></div>
  ${itemsHtml}
  <div class="dash"></div>
  <div class="row"><span>المجموع:</span><span>${formatPrice(invoice.total)}</span></div>
  ${isDelivery && (invoice.deliveryFee || 0) > 0 ? `<div class="row"><span>التوصيل:</span><span>${formatPrice(invoice.deliveryFee!)}</span></div>` : ""}
  ${(invoice.discount || 0) > 0 ? `<div class="row"><span>الخصم:</span><span>-${formatPrice(invoice.discount)}</span></div>` : ""}
  ${riderChange > 0 ? `<div class="row highlight"><span>الباقي مع الطيار:</span><span>${formatPrice(riderChange)}</span></div>` : ""}
  <div class="row total"><span>الإجمالي:</span><span>${formatPrice(invoice.finalTotal)}</span></div>
  <div class="row"><span>الدفع:</span><span>${invoice.paymentType === "card" ? "فيزا" : invoice.paymentType === "credit" ? "آجل" : "كاش"}</span></div>
  <div class="footer">شكراً لتعاملكم مع ماركت أبناء سوهاج</div>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close()},300)}</script>
</body>
</html>`;
}

/** Opens a dedicated 80mm print window — reliable for repeat prints */
export function openReceiptPrintWindow(invoice: ReceiptInvoice): boolean {
  const win = window.open("", "_blank", "width=320,height=600");
  if (!win) return false;
  win.document.open();
  win.document.write(buildReceiptHtml(invoice));
  win.document.close();
  return true;
}

/** Try silent API print, fall back to thermal popup */
export async function printReceipt(invoice: ReceiptInvoice): Promise<void> {
  try {
    const res = await fetch("/api/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    });
    if (res.ok) return;
  } catch {
    /* fall through */
  }
  if (!openReceiptPrintWindow(invoice)) {
    throw new Error("فشل فتح نافذة الطباعة");
  }
}

export function toReceiptInvoice(raw: any, extras?: { riderChange?: number; isReprint?: boolean }): ReceiptInvoice {
  return {
    invoiceNo: raw.invoiceNo,
    createdAt: raw.createdAt,
    orderType: raw.orderType,
    total: raw.total,
    discount: raw.discount || 0,
    finalTotal: raw.finalTotal,
    deliveryFee: raw.deliveryFee,
    paymentType: raw.paymentType,
    customer: raw.customer || null,
    items: raw.items || [],
    riderChange: extras?.riderChange ?? raw.riderChange ?? 0,
    isReprint: extras?.isReprint,
  };
}
