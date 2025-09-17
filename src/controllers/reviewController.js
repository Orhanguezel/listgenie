import asyncHandler from "express-async-handler";
import Review from "../models/Review.js";

// 📌 **Tüm yorumları getir (Admin)**
export const fetchReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().populate("user", "name email profileImage");
  res.json(reviews);
});

// 📌 **Belirli bir ürünün yorumlarını getir**
export const fetchProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId }).populate("user", "name profileImage");
  
  if (!reviews) {
    res.status(404);
    throw new Error("Bu ürün için yorum bulunamadı.");
  }

  res.json({ reviews });
});

// 📌 **Yeni yorum ekleme**
export const addReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;

  const review = await Review.create({
    productId,
    user: req.user.id,
    name: req.user.name,
    avatar: req.user.profileImage || "https://randomuser.me/api/portraits/lego/1.jpg",
    rating,
    comment,
  });

  res.status(201).json(review);
});

// 📌 **Yorumu Güncelleme**
export const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Yorum bulunamadı.");
  }

  // Kullanıcı yetkisini kontrol et
  if (review.user.toString() !== req.user.id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Bu yorumu güncelleme yetkiniz yok.");
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;

  await review.save();
  res.json(review);
});

// 📌 **Yorum Silme (Admin veya yorumu yazan kişi)**
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Yorum bulunamadı.");
  }

  // Kullanıcı yetkisini kontrol et
  if (review.user.toString() !== req.user.id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Bu yorumu silme yetkiniz yok.");
  }

  await review.deleteOne();
  res.json({ message: "Yorum başarıyla silindi." });
});

// 📌 **Belirli bir kullanıcının yorumlarını getir (Admin)**
export const getReviewsByUser = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.params.userId });

  if (!reviews) {
    res.status(404);
    throw new Error("Bu kullanıcıya ait yorum bulunamadı.");
  }

  res.json(reviews);
});

// 📌 **Belirli bir ürünün tüm yorumlarını sil (Admin)**
export const deleteAllReviewsByProduct = asyncHandler(async (req, res) => {
  await Review.deleteMany({ productId: req.params.productId });
  res.json({ message: "Ürüne ait tüm yorumlar silindi." });
});
