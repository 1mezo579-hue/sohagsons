const testInvoice = async () => {
  const res = await fetch("http://localhost:3000/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invoiceNo: "TEST-INV-" + Date.now(),
      userId: 1, // assuming user 1 exists
      customerId: null,
      total: 100,
      discount: 0,
      finalTotal: 100,
      paymentType: "cash",
      items: [
        {
          productId: 1, // assuming product 1 exists
          quantity: 1,
          price: 100,
          total: 100
        }
      ]
    })
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
};

testInvoice();
