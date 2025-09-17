import Shipment from "../models/Shipment.js";
import Order from "../models/Order.js"; // Sipariş doğrulaması için eklendi

// ✅ Yeni kargo ekleme
export const addShipment = async (req, res) => {
  try {
    const { order, status, trackingNumber, estimatedDelivery, carrier, carrierDetails, recipientName, deliveryType } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ error: "Tracking number is required!" });
    }

    // 🔍 Order ID doğrulama
    const existingOrder = await Order.findById(order);
    if (!existingOrder) return res.status(400).json({ message: "Geçersiz sipariş ID!" });

    // ✅ Yeni kargo oluştur
    const newShipment = new Shipment({
      order,
      status,
      trackingNumber,
      estimatedDelivery,
      carrier,
      carrierDetails, // `{ company: "UPS", contactNumber: "123-456-7890" }`
      recipientName,
      deliveryType,
    });

    await newShipment.save();
    res.status(201).json(newShipment);
  } catch (error) {
    console.error("🔴 Kargo ekleme hatası:", error);
    res.status(500).json({ error: "Kargo eklenirken hata oluştu!" });
  }
};

// ✅ Tüm kargoları getir (Sipariş bilgileriyle birlikte)
export const getShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().populate("order", "totalAmount status createdAt");
    res.status(200).json(shipments);
  } catch (error) {
    res.status(500).json({ error: "Kargolar alınırken hata oluştu!" });
  }
};

// ✅ Belirli bir kargoyu getir
export const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate("order", "totalAmount status createdAt");
    if (!shipment) return res.status(404).json({ message: "Kargo bulunamadı" });

    res.status(200).json(shipment);
  } catch (error) {
    res.status(500).json({ message: "Kargo getirilemedi", error: error.message });
  }
};

// ✅ Kargo güncelleme (Eksikler giderildi)
export const updateShipment = async (req, res) => {
  try {
    const { status, trackingNumber, estimatedDelivery, carrier, carrierDetails, recipientName, deliveryType } = req.body;

    const updatedShipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { status, trackingNumber, estimatedDelivery, carrier, carrierDetails, recipientName, deliveryType },
      { new: true }
    );

    if (!updatedShipment) return res.status(404).json({ message: "Kargo bulunamadı" });

    res.status(200).json(updatedShipment);
  } catch (error) {
    res.status(500).json({ message: "Kargo güncellenemedi", error: error.message });
  }
};

// ✅ Kargoyu sil
export const deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) return res.status(404).json({ message: "Kargo bulunamadı" });

    res.status(200).json({ message: "Kargo başarıyla silindi" });
  } catch (error) {
    res.status(500).json({ message: "Kargo silinemedi", error: error.message });
  }
};
