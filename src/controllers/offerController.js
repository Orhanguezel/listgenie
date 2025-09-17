import Offer from "../models/Offer.js";
import Product from "../models/Product.js";
import Company from "../models/Company.js";
import Customer from "../models/Customer.js";
import { v4 as uuidv4 } from "uuid";

// ✅ Yeni teklif oluştur
export const createOffer = async (req, res) => {
  try {
    const { user, company, customer, items, taxRate, shippingCost, validUntil, notes, paymentTerms } = req.body;

    if (!user || !company || !customer || !items.length) {
      return res.status(400).json({ message: "Eksik bilgiler! Lütfen kullanıcı, firma ve müşteri bilgilerini kontrol edin." });
    }

    // 🔍 Firma ve müşteri doğrulaması
    const companyExists = await Company.findById(company);
    if (!companyExists) return res.status(404).json({ message: "Şirket bulunamadı!" });

    const customerExists = await Customer.findById(customer);
    if (!customerExists) return res.status(404).json({ message: "Müşteri bulunamadı!" });

    let totalAmount = 0;
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) throw new Error(`Ürün bulunamadı: ${item.product}`);

        totalAmount += item.customPrice * item.quantity; // 🎯 `customPrice` kullanılıyor!

        return {
          product: product._id,
          quantity: item.quantity,
          unitPrice: product.price,
          customPrice: item.customPrice, // ✅ Ürün için teklif fiyatı
        };
      })
    );

    const taxAmount = (totalAmount * taxRate) / 100;
    const finalAmount = totalAmount + taxAmount + (shippingCost || 0);

    const offer = new Offer({
      offerNumber: `OFR-${uuidv4().slice(0, 8)}`, // 🔢 Teklif Numarası
      user,
      company,
      customer,
      items: enrichedItems,
      totalAmount: finalAmount,
      taxAmount,
      taxRate,
      shippingCost,
      validUntil,
      notes,
      paymentTerms: paymentTerms || "30 gün içinde ödeme",
      status: "draft",
      sentByEmail: false, // 📩 Başlangıçta e-posta ile gönderilmedi
      pdfLink: "", // 📄 Başlangıçta PDF linki yok
    });

    await offer.save();
    res.status(201).json({ message: "Teklif başarıyla oluşturuldu!", offer });
  } catch (error) {
    res.status(500).json({ message: "Teklif oluşturulurken hata oluştu!", error: error.message });
  }
};

// ✅ Teklifleri listele
export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("user", "name email")
      .populate("company", "companyName email")
      .populate("customer", "companyName contactName email")
      .populate("items.product", "name price");

    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: "Teklifler getirilemedi!", error: error.message });
  }
};

// ✅ Belirli bir teklifi getir
export const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate("user", "name email")
      .populate("company", "companyName email")
      .populate("customer", "companyName contactName email")
      .populate("items.product", "name price");

    if (!offer) return res.status(404).json({ message: "Teklif bulunamadı!" });

    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: "Teklif getirilemedi!", error: error.message });
  }
};

// ✅ Teklifi güncelle
export const updateOffer = async (req, res) => {
  try {
    const { items, taxRate, shippingCost, validUntil, notes, paymentTerms, sentByEmail, pdfLink } = req.body;

    if (!items.length) {
      return res.status(400).json({ message: "Teklifte en az bir ürün bulunmalıdır." });
    }

    let totalAmount = 0;
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) throw new Error(`Ürün bulunamadı: ${item.product}`);

        totalAmount += item.customPrice * item.quantity;

        return {
          product: product._id,
          quantity: item.quantity,
          unitPrice: product.price,
          customPrice: item.customPrice, // ✅ Özel teklif fiyatı
        };
      })
    );

    const taxAmount = (totalAmount * taxRate) / 100;
    const finalAmount = totalAmount + taxAmount + (shippingCost || 0);

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { items: enrichedItems, totalAmount: finalAmount, taxAmount, taxRate, shippingCost, validUntil, notes, paymentTerms, sentByEmail, pdfLink },
      { new: true }
    );

    if (!offer) return res.status(404).json({ message: "Teklif bulunamadı!" });

    res.status(200).json({ message: "Teklif başarıyla güncellendi!", offer });
  } catch (error) {
    res.status(500).json({ message: "Teklif güncellenemedi!", error: error.message });
  }
};

// ✅ Teklif durumunu güncelle
export const updateOfferStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const offer = await Offer.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!offer) return res.status(404).json({ message: "Teklif bulunamadı!" });

    res.status(200).json({ message: `Teklif ${status} olarak güncellendi!`, offer });
  } catch (error) {
    res.status(500).json({ message: "Teklif durumu güncellenemedi!", error: error.message });
  }
};

// ✅ Teklifi sil
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ message: "Teklif bulunamadı!" });

    res.status(200).json({ message: "Teklif başarıyla silindi!" });
  } catch (error) {
    res.status(500).json({ message: "Teklif silinemedi!", error: error.message });
  }
};
