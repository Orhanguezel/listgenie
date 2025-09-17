import Store from "../models/Store.js";
import User from "../models/User.js"; // Kullanıcı doğrulaması için eklendi

// ✅ Tüm mağazaları getir
export const getStores = async (req, res) => {
  try {
    const stores = await Store.find().populate("owner", "name email"); // Mağaza sahibi bilgisiyle birlikte getir
    res.json(stores);
  } catch (error) {
    console.error("❌ Mağazaları getirirken hata:", error);
    res.status(500).json({ error: "Mağazaları getirirken hata oluştu!" });
  }
};

// ✅ Yeni mağaza ekle
export const addStore = async (req, res) => {
  try {
    const { name, locations, owner, businessHours, stockLevel } = req.body;

    // 🔍 Kullanıcı olup olmadığını kontrol et
    const existingUser = await User.findById(owner);
    if (!existingUser) return res.status(400).json({ message: "Geçersiz kullanıcı ID!" });

    // ✅ Yeni mağaza oluştur
    const newStore = new Store({ name, locations, owner, businessHours, stockLevel });
    await newStore.save();

    res.status(201).json(newStore);
  } catch (error) {
    console.error("❌ Mağaza eklenirken hata:", error);
    res.status(500).json({ error: "Mağaza eklenirken hata oluştu!" });
  }
};

// ✅ Belirli bir mağazayı getir
export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate("owner", "name email");
    if (!store) return res.status(404).json({ message: "Mağaza bulunamadı" });

    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: "Mağaza getirilemedi", error: error.message });
  }
};

// ✅ Mağaza güncelleme (Eksikler giderildi)
export const updateStore = async (req, res) => {
  try {
    const { name, locations, businessHours, stockLevel } = req.body;

    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      { name, locations, businessHours, stockLevel },
      { new: true }
    );

    if (!updatedStore) return res.status(404).json({ message: "Mağaza bulunamadı" });

    res.status(200).json(updatedStore);
  } catch (error) {
    res.status(500).json({ message: "Mağaza güncellenemedi", error: error.message });
  }
};

// ✅ Mağaza silme
export const deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ message: "Mağaza bulunamadı" });

    res.status(200).json({ message: "Mağaza başarıyla silindi" });
  } catch (error) {
    res.status(500).json({ message: "Mağaza silinemedi", error: error.message });
  }
};


