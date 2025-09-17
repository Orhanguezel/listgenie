import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// ✅ Yeni ödeme oluştur (Tüm detaylarla birlikte)
export const createPayment = async (req, res) => {
  try {
    const { order, amount, paymentMethod, transactionId } = req.body;

    // 🔍 Siparişin varlığını kontrol et
    const existingOrder = await Order.findById(order);
    if (!existingOrder) {
      return res.status(404).json({ message: "Sipariş bulunamadı!" });
    }

    // 🔍 Ödeme tutarı ve KDV hesaplama
    const taxRate = 19; // Almanya’da standart KDV oranı
    const taxAmount = (amount * taxRate) / 100;
    const totalAmount = amount + taxAmount;

    // ✅ Yeni ödeme oluştur
    const payment = new Payment({
      order,
      user: req.user._id,
      amount: totalAmount,
      taxAmount,
      paymentMethod,
      transactionId,
      status: "completed",
    });

    // ✅ Siparişin ödeme durumunu güncelle
    existingOrder.paymentStatus = "paid";
    await existingOrder.save();

    const savedPayment = await payment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ message: "Ödeme işlemi başarısız!", error: error.message });
  }
};

// ✅ Kullanıcının yaptığı tüm ödemeleri getir (Kapsamlı)
export const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("order", "totalAmount status createdAt") // Sipariş bilgileri getir
      .populate("user", "name email"); // Kullanıcı bilgisi getir

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Ödemeler getirilirken hata oluştu!" });
  }
};

// ✅ Belirli bir ödemenin detaylarını getir (Sipariş ve kullanıcı bilgileriyle birlikte)
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("order", "totalAmount status createdAt")
      .populate("user", "name email");

    if (!payment) {
      return res.status(404).json({ message: "Ödeme bulunamadı!" });
    }
    res.status(200).json(payment);
  } catch (error) {
    console.error("Ödeme detayları getirilirken hata:", error);
    res.status(500).json({ message: "Ödeme detayları getirilirken hata oluştu!" });
  }
};

// ✅ Admin için tüm ödemeleri getir (Geniş kapsamlı)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("order", "totalAmount status createdAt")
      .populate("user", "name email");

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Tüm ödemeler getirilirken hata oluştu!" });
  }
};

// ✅ Ödeme iadesi (Refund)
export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Ödeme bulunamadı!" });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({ message: "Bu ödeme iade edilemez!" });
    }

    // ✅ Ödemeyi iade olarak işaretle
    payment.status = "refunded";
    await payment.save();

    // ✅ Siparişin ödeme durumunu güncelle
    const order = await Order.findById(payment.order);
    order.paymentStatus = "refunded";
    await order.save();

    res.status(200).json({ message: "Ödeme başarıyla iade edildi", payment });
  } catch (error) {
    res.status(500).json({ message: "İade işlemi başarısız!", error: error.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .populate("order", "totalAmount status createdAt");

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Ödemeler alınamadı!", error: error.message });
  }
};

