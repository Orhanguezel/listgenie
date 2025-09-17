import Favorite from "../models/Favorite.js";

// ✅ Kullanıcının favorilerini getir
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.find({ userId }).select("productId -_id");
    const favoriteIds = favorites.map((fav) => fav.productId);
    return res.status(200).json(favoriteIds);
  } catch (error) {
    res.status(500).json({ message: "Favoriler yüklenemedi!" });
  }
};


// ✅ Favoriye yeni ürün ekle
export const addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Eğer favoride zaten varsa, hata döndür
    const existingFavorite = await Favorite.findOne({ userId, productId });
    if (existingFavorite) {
      return res.status(400).json({ message: "Bu ürün zaten favorilere eklenmiş!" });
    }

    const newFavorite = new Favorite({ userId, productId });
    await newFavorite.save();
    res.status(201).json(newFavorite);
  } catch (error) {
    res.status(500).json({ message: "Favori eklenemedi!" });
  }
};

// ✅ Favoriden ürün kaldır
export const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    await Favorite.findOneAndDelete({ userId, productId });
    res.status(200).json({ message: "Favori başarıyla kaldırıldı!" });
  } catch (error) {
    res.status(500).json({ message: "Favori silinemedi!" });
  }
};
