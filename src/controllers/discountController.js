import Discount from "../models/Discount.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";



// ✅ Tüm indirimleri getir
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find();
    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: "İndirimler alınamadı!", error: error.message });
  }
};

// ✅ Yeni indirim kodu oluştur
export const createDiscount = async (req, res) => {
  try {
    const { code, discountPercentage, validFrom, validUntil, categoryId, productId, isActive } = req.body;

    // 🔍 Eğer bir kategori veya ürün seçildiyse, var olup olmadığını kontrol et
    if (categoryId) {
      const existingCategory = await Category.findById(categoryId);
      if (!existingCategory) return res.status(400).json({ message: "Geçersiz kategori ID!" });
    }

    if (productId) {
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) return res.status(400).json({ message: "Geçersiz ürün ID!" });
    }

    const newDiscount = new Discount({
      code,
      discountPercentage,
      validFrom,
      validUntil,
      categoryId,
      productId,
      isActive,
    });

    await newDiscount.save();
    res.status(201).json({ message: "İndirim kodu başarıyla oluşturuldu!", newDiscount });
  } catch (error) {
    res.status(500).json({ message: "İndirim kodu eklenirken hata oluştu!", error: error.message });
  }
};

// ✅ Tüm indirim kodlarını getir (Admin yetkisi gerektirir)
export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find()
      .populate("categoryId", "name")
      .populate("productId", "name price");

    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: "İndirim kodları getirilirken hata oluştu!", error: error.message });
  }
};

// ✅ İndirim kodunu uygula
export const applyDiscount = async (req, res) => {
  try {
    const { code, cartTotal, productId, categoryId } = req.body;

    const discount = await Discount.findOne({ code });

    if (!discount) {
      return res.status(404).json({ message: "Geçersiz indirim kodu!" });
    }

    // 🔍 İndirim kodu aktif mi ve tarih aralığında mı?
    const now = new Date();
    if (!discount.isActive || now < discount.validFrom || now > discount.validUntil) {
      return res.status(400).json({ message: "Bu indirim kodu şu anda kullanılamaz!" });
    }

    // 🔍 Eğer belirli bir ürün veya kategori için tanımlandıysa kontrol et
    if (discount.productId && discount.productId.toString() !== productId) {
      return res.status(400).json({ message: "Bu indirim kodu bu ürün için geçerli değil!" });
    }

    if (discount.categoryId && discount.categoryId.toString() !== categoryId) {
      return res.status(400).json({ message: "Bu indirim kodu bu kategori için geçerli değil!" });
    }

    // 🔍 Yeni indirimli fiyatı hesapla
    const discountAmount = (cartTotal * discount.discountPercentage) / 100;
    const newTotal = cartTotal - discountAmount;

    res.status(200).json({ message: "İndirim kodu başarıyla uygulandı!", discountAmount, newTotal });
  } catch (error) {
    res.status(500).json({ message: "İndirim kodu uygulanırken hata oluştu!", error: error.message });
  }
};

// ✅ İndirim kodunu sil (Admin yetkisi gerektirir)
export const deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) return res.status(404).json({ message: "İndirim kodu bulunamadı!" });

    res.status(200).json({ message: "İndirim kodu başarıyla silindi!" });
  } catch (error) {
    res.status(500).json({ message: "İndirim kodu silinemedi!", error: error.message });
  }
};
