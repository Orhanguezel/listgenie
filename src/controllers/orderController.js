import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Invoice from "../models/Invoice.js";

// 📌 Yeni Sipariş Oluşturma (Vergi + Stok Güncelleme)
export const createOrder = async (req, res) => {
  try {
    const {
      products,
      totalAmount,
      shippingAddress,
      trackingNumber,
      paymentStatus,
      company,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(company)) {
      return res.status(400).json({ message: "🚨 Geçersiz şirket ID formatı!" });
    }

    const enrichedProducts = await Promise.all(
      products.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error(`🚨 Ürün bulunamadı: ${item.productId}`);

        if (product.stock < item.quantity) throw new Error(`🚨 Yetersiz stok: ${product.title}`);

        product.stock -= item.quantity;
        await product.save();

        return {
          product: product._id,
          name: product.title,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      })
    );

    const taxAmount = parseFloat((totalAmount * 0.19).toFixed(2));

    const order = new Order({
      user: req.user._id,
      company: company,
      products: enrichedProducts,
      totalAmount,
      taxAmount,
      shippingAddress,
      paymentStatus: "pending",
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: "🚨 Sipariş oluşturulamadı!", error: error.message });
  }
};

// 📌 Kullanıcıya Ait Siparişleri Getir
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("user", "name email")
      .populate("products.product", "title price category stock");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "🚨 Siparişler getirilirken hata oluştu!", error: error.message });
  }
};

// 📌 Tüm Siparişleri Getir (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("products.product", "title price stock category");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "🚨 Tüm siparişler getirilirken hata oluştu!", error: error.message });
  }
};

// 📌 Belirli Siparişi Getir
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("products.product", "title price stock category")
      .populate("company");

    if (!order) return res.status(404).json({ message: "🚨 Sipariş bulunamadı!" });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "🚨 Sipariş detayları getirilirken hata oluştu!", error: error.message });
  }
};
// 📌 **Sipariş durumu güncelleme veya iptal**
export const updateOrderStatusOrCancel = async (req, res) => {
  try {
    const { status } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "🚨 Sipariş bulunamadı!" });
    }

    console.log(`📌 Sipariş durumu "${order.status}" → "${status}" olarak güncelleniyor.`);

    if (status === "cancelled" && !order.isCancelled) {
      await Promise.all(
        order.products.map(async (item) => {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.quantity;
            await product.save();
          }
        })
      );
      order.isCancelled = true;
    }

    order.status = status;
    await order.save();

    if (status === "shipped") {
      console.log("📌 Sipariş 'shipped' durumuna geçti, fatura oluşturuluyor...");
      const existingInvoice = await Invoice.findOne({ order: order._id });

      if (!existingInvoice) {
        const invoiceItems = order.products.map((item) => ({
          product: item.product,
          name: item.name || item.product.title || "Bilinmeyen Ürün",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));

        const taxRate = 19;
        const taxAmount = parseFloat((order.totalAmount * taxRate / 100).toFixed(2));
        const finalAmount = parseFloat((order.totalAmount + taxAmount).toFixed(2));

        const invoice = new Invoice({
          order: order._id,
          user: order.user,
          company: order.company,
          items: invoiceItems,
          totalAmount: finalAmount,
          taxAmount,
          taxRate,
          invoiceNumber: `INV-${Date.now()}`,
          status: order.paymentStatus === "paid" ? "paid" : "pending",
        });

        await invoice.save();
        console.log("✅ Fatura başarıyla oluşturuldu:", invoice);
      }
    }

    // 🔥 **SİPARİŞİ TEKRAR POPULATE ET**
    order = await Order.findById(order._id)
      .populate("user", "_id name email")
      .populate("company", "_id companyName email")
      .populate("products.product", "_id title price stock category");

    console.log("📌 Güncellenmiş Sipariş Backend'den Dönüyor:", order);
    res.json({ message: "✅ Sipariş durumu başarıyla güncellendi!", order });
  } catch (error) {
    console.error("🚨 Sipariş güncellenirken hata oluştu:", error.message);
    res.status(500).json({ message: "🚨 Sipariş güncellenirken hata oluştu!", error: error.message });
  }
};



