import Sale from "../models/Sale.js";
import Order from "../models/Order.js";

// ✅ Sipariş tamamlandığında satış olarak kaydet
export const recordSale = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      console.error("Hata: Sipariş bulunamadı!");
      return;
    }

    const newSale = new Sale({
      order: order._id,
      user: order.user._id,
      totalAmount: order.totalAmount,
      taxAmount: (order.totalAmount * 19) / 100, // %19 KDV
      paymentMethod: order.paymentMethod,
      saleDate: new Date(),
    });

    await newSale.save();
    console.log(`✅ Satış başarıyla kaydedildi: ${newSale._id}`);
  } catch (error) {
    console.error("❌ Satış kaydedilemedi:", error);
  }
};

// ✅ Tüm satışları getir
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate("user", "name email").populate("order", "totalAmount saleDate");
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Satışlar alınamadı!", error: error.message });
  }
};

// ✅ Belirli bir satış kaydını getir
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate("user", "name email").populate("order");
    if (!sale) return res.status(404).json({ message: "Satış bulunamadı!" });

    res.status(200).json(sale);
  } catch (error) {
    res.status(500).json({ message: "Satış getirilemedi!", error: error.message });
  }
};

// ✅ Aylık satış analizini getir
export const getMonthlySales = async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      {
        $group: {
          _id: { month: { $month: "$saleDate" }, year: { $year: "$saleDate" } },
          totalSales: { $sum: "$totalAmount" },
          saleCount: { $sum: 1 },
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Aylık satış raporu alınamadı!", error: error.message });
  }
};
