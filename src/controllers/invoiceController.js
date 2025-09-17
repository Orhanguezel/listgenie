import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { getCompanyInfo, calculateTax, generateInvoicePDF } from "../helpers/invoiceHelper.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 📌 **Siparişten Fatura Oluştur**
export const createInvoice = async (req, res) => {
  try {
    const { order: orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "🚨 Sipariş ID eksik!" });

    const existingOrder = await Order.findById(orderId).populate("products.product");
    console.log("📌 Mevcut sipariş bilgisi:", existingOrder);

    if (!existingOrder) return res.status(404).json({ message: "🚨 Sipariş bulunamadı!" });

    if (!existingOrder.company) {
      return res.status(400).json({ message: "🚨 Sipariş içinde şirket bilgisi eksik!" });
    }

    // ✅ **Şirket bilgilerini al**
    const company = await getCompanyInfo();
    console.log("📌 Alınan şirket bilgisi:", company);

    if (!company) return res.status(500).json({ message: "🚨 Şirket bilgisi bulunamadı!" });

    // ✅ **Vergi hesaplaması**
    const { taxAmount, finalAmount } = calculateTax(existingOrder.totalAmount);

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const invoice = new Invoice({
      order: existingOrder._id,
      user: existingOrder.user,
      company: existingOrder.company, // ✅ **Siparişteki şirket bilgisi kullanılıyor**
      items: existingOrder.products.map((item) => ({
        product: item.product._id,
        name: item.product.title || "Bilinmeyen Ürün",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalAmount: finalAmount,
      taxAmount,
      taxRate: 19,
      invoiceNumber,
      status: existingOrder.paymentStatus === "paid" ? "paid" : "pending",
    });

    console.log("📌 Oluşturulan fatura verisi:", invoice);

    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "🚨 Fatura oluşturulurken hata oluştu!", error: error.message });
  }
};



// 📌 **Kullanıcının faturalarını getir**
export const getUserInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .populate("order", "totalAmount status createdAt")
      .populate("items.product", "title price")
      .populate("company");

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "🚨 Faturalar getirilirken hata oluştu!", error: error.message });
  }
};


// 📌 **Admin için tüm faturaları getir**
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("user", "name email")
      .populate("order", "totalAmount status createdAt")
      .populate("items.product", "title price")
      .populate("company");

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "🚨 Tüm faturalar getirilirken hata oluştu!", error: error.message });
  }
};


// 📌 **Belirli bir faturayı getir**
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email")
      .populate("order", "totalAmount status createdAt")
      .populate("items.product", "title price")
      .populate("company");

    if (!invoice) return res.status(404).json({ message: "🚨 Fatura bulunamadı!" });

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "🚨 Fatura alınırken hata oluştu!", error: error.message });
  }
};

// 📌 **Fatura PDF oluştur ve indir**
export const getInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email address")
      .populate("order", "totalAmount status createdAt")
      .populate("items.product", "title price")
      .populate("company");

    if (!invoice) {
      console.error("🚨 Fatura bulunamadı!");
      return res.status(404).json({ message: "🚨 Fatura bulunamadı!" });
    }

    console.log("📌 PDF için kullanılan fatura verisi:", invoice);

    const filePath = await generateInvoicePDF(invoice);
    if (!filePath) {
      console.error("🚨 PDF dosya yolu bulunamadı!");
      return res.status(500).json({ message: "🚨 PDF oluşturulurken hata oluştu!" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("🚨 PDF oluşturma hatası:", error.message);
    res.status(500).json({ message: "🚨 PDF oluşturulurken hata oluştu!", error: error.message });
  }
};

// 📌 **Fatura silme işlemi**
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: "🚨 Fatura bulunamadı!" });
    res.status(200).json({ message: "✅ Fatura başarıyla silindi!" });
  } catch (error) {
    res.status(500).json({ message: "🚨 Fatura silinirken hata oluştu!", error: error.message });
  }
};
