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

const THERMAL_CSS = `@page{size:80mm auto;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Tahoma,Arial,sans-serif;direction:rtl;width:74mm;max-width:74mm;margin:0 auto;padding:2mm 3mm;color:#111;font-size:11px;line-height:1.3}.c{text-align:center}.t{font-size:15px;font-weight:900;margin-bottom:1px}.p{font-size:10px;font-weight:700;color:#333;margin:1px 0}.b{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:800;padding:1px 6px;border-radius:3px;margin:3px 0}.br{background:#be123c}.m{font-size:9px;color:#666;margin:1px 0}.d{border-top:1px dashed #bbb;margin:4px 0}.cu{background:#f3f4f6;border-radius:3px;padding:3px 5px;margin:3px 0;font-size:10px;font-weight:700}.cu s{display:block;font-weight:500;font-size:9px;color:#555;margin-top:1px}.i{display:flex;justify-content:space-between;gap:3px;margin:1px 0;font-size:11px}.in{flex:1;word-break:break-word}.ip{white-space:nowrap;font-weight:600}.r{display:flex;justify-content:space-between;margin:1px 0;font-size:11px}.rt{font-size:13px;font-weight:900;border-top:1px solid #ccc;padding-top:3px;margin-top:3px}.rh{color:#b45309;font-weight:800}.f{text-align:center;font-size:9px;color:#777;margin-top:4px;padding-top:3px;border-top:1px solid #ddd}`;

function itemName(item: ReceiptInvoice["items"][0]): string {
  return item.product?.name || "منتج";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function canUseSilentPrint(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.") || h.startsWith("10.");
}

let printFrame: HTMLIFrameElement | null = null;

function getPrintFrame(): HTMLIFrameElement {
  if (printFrame?.contentWindow) return printFrame;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  printFrame = frame;
  return frame;
}

export function buildReceiptHtml(invoice: ReceiptInvoice): string {
  const isDelivery = invoice.orderType === "delivery";
  const isReturn = invoice.orderType === "return";
  const pointsEarned = Math.floor(Math.abs(invoice.finalTotal) / 10);
  const riderChange = invoice.riderChange || 0;

  const itemsHtml = invoice.items
    .map(
      (item) =>
        `<div class="i"><span class="in">${esc(itemName(item))} x ${item.quantity}</span><span class="ip">${formatPrice(item.total)}</span></div>`
    )
    .join("");

  let customerHtml = "";
  if (invoice.customer) {
    customerHtml = `<div class="cu">العميل: ${esc(invoice.customer.name)}${
      invoice.customer.phone ? `<s>هاتف: ${esc(invoice.customer.phone)}</s>` : ""
    }${invoice.customer.address ? `<s>عنوان: ${esc(invoice.customer.address)}</s>` : ""}${
      !isReturn ? `<s>نقاط الفاتورة: ${pointsEarned}</s>` : ""
    }${invoice.customer.points != null ? `<s>رصيد النقاط: ${invoice.customer.points}</s>` : ""}${
      (invoice.customer.balance || 0) > 0 ? `<s>رصيد آجل: ${formatPrice(invoice.customer.balance!)}</s>` : ""
    }</div>`;
  }

  const typeBadge = isReturn
    ? `<div class="b br">مرتجع</div>`
    : isDelivery
      ? `<div class="b">دليفري</div>`
      : `<div class="m">فاتورة مبيعات</div>`;

  const dt = new Date(invoice.createdAt).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${esc(invoice.invoiceNo)}</title><style>${THERMAL_CSS}</style></head><body><div class="c"><div class="t">ماركت ابناء سوهاج</div><div class="p">035551771 - 01224163621</div><div class="p">واتس: 01211469399</div>${typeBadge}${
    invoice.isReprint ? `<div class="m">(اعادة طباعة)</div>` : ""
  }<div class="m" style="font-family:monospace">${esc(invoice.invoiceNo)}</div><div class="m">${dt}</div></div>${customerHtml}<div class="d"></div>${itemsHtml}<div class="d"></div><div class="r"><span>المجموع:</span><span>${formatPrice(invoice.total)}</span></div>${
    isDelivery && (invoice.deliveryFee || 0) > 0
      ? `<div class="r"><span>التوصيل:</span><span>${formatPrice(invoice.deliveryFee!)}</span></div>`
      : ""
  }${
    (invoice.discount || 0) > 0
      ? `<div class="r"><span>الخصم:</span><span>-${formatPrice(invoice.discount)}</span></div>`
      : ""
  }${
    riderChange > 0
      ? `<div class="r rh"><span>الباقي مع الطيار:</span><span>${formatPrice(riderChange)}</span></div>`
      : ""
  }<div class="r rt"><span>الاجمالي:</span><span>${formatPrice(invoice.finalTotal)}</span></div><div class="r"><span>الدفع:</span><span>${
    invoice.paymentType === "card" ? "فيزا" : invoice.paymentType === "credit" ? "آجل" : "كاش"
  }</span></div><div class="f">شكرا لتعاملكم مع ماركت ابناء سوهاج</div></body></html>`;
}

/** Fast iframe print — no popup blocker, reuses same frame */
export function openReceiptPrintWindow(invoice: ReceiptInvoice): boolean {
  try {
    const frame = getPrintFrame();
    const win = frame.contentWindow;
    if (!win) return false;

    const doc = win.document;
    doc.open();
    doc.write(buildReceiptHtml(invoice));
    doc.close();

    requestAnimationFrame(() => {
      win.focus();
      win.print();
    });
    return true;
  } catch {
    return false;
  }
}

function silentPrintFetch(invoice: ReceiptInvoice): void {
  fetch("/api/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoice),
    keepalive: true,
  }).catch(() => {
    openReceiptPrintWindow(invoice);
  });
}

/** Non-blocking print: silent thermal on local POS, iframe on cloud */
export function printReceipt(invoice: ReceiptInvoice): Promise<void> {
  if (canUseSilentPrint()) {
    silentPrintFetch(invoice);
    return Promise.resolve();
  }

  if (!openReceiptPrintWindow(invoice)) {
    return Promise.reject(new Error("فشل الطباعة"));
  }
  return Promise.resolve();
}

/** Await silent print result (for reprint / manual retry) */
export async function printReceiptAndWait(invoice: ReceiptInvoice): Promise<void> {
  if (canUseSilentPrint()) {
    try {
      const res = await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });
      if (res.ok) return;
    } catch {
      /* fallback */
    }
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
