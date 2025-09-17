import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";

// 🔐 **Kullanıcı Doğrulama (JWT ile)**
export const authenticate = asyncHandler(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "❌ Yetkilendirme başarısız! Token eksik." });
    }

    // ✅ **Token'i çözümle (decode et)**
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ **Kullanıcıyı Veritabanından Çek**
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "❌ Yetkilendirme başarısız! Kullanıcı bulunamadı." });
    }

    // 🚫 **Bloklanmış kullanıcılar giriş yapamaz!**
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "⚠️ Hesabınız devre dışı bırakılmıştır!" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "⏳ Token süresi doldu, tekrar giriş yapınız!" });
    }
    return res.status(401).json({ success: false, message: "❌ Geçersiz veya süresi dolmuş token!" });
  }
});

// 🛑 **Rol Bazlı Yetkilendirme (Admin veya Belirli Roller)**
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "❌ Yetkilendirme başarısız! Kullanıcı doğrulanamadı." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `🚫 Yetkisiz işlem! Bu işlem için gerekli roller: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

// ✅ **Yetkilendirme Middleware'leri**
export const protect = authenticate;
export const admin = authorizeRoles("admin");
export const moderator = authorizeRoles("moderator");
export const staff = authorizeRoles("staff");
