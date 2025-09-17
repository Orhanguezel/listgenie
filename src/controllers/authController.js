import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { generateToken } from "../utils/jwt.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();


// ✅ **Kullanıcı Kayıt**

const BASE_URL = process.env.BASE_URL

export const registerUser = asyncHandler(async (req, res) => {
  console.log("📌 Backend'e Gelen Veri:", req.body);
  console.log("📂 Yüklenen Dosya:", req.file);

  let {
    name,
    email,
    password,
    role = "user",
    phone,
    addresses = "[]",
    profileImage = "",
    bio = "",
    birthDate,
    socialMedia = '{"facebook": "", "twitter": "", "instagram": ""}',
    notifications = '{"emailNotifications": true, "smsNotifications": false}'
  } = req.body;

  // 📌 **JSON string'leri parse et**
  try {
    addresses = typeof addresses === "string" ? JSON.parse(addresses) : addresses;
    socialMedia = typeof socialMedia === "string" ? JSON.parse(socialMedia) : socialMedia;
    notifications = typeof notifications === "string" ? JSON.parse(notifications) : notifications;
  } catch (error) {
    return res.status(400).json({ message: "❌ JSON formatı hatalı!" });
  }

  // 📌 **Şifre Kontrolü**
  if (!password) {
    return res.status(400).json({ message: "❌ Şifre alanı gereklidir!" });
  }

  // 📌 **Profil Resmi İşleme**
  if (req.file) {
    profileImage = `${BASE_URL}/uploads/profile-images/${req.file.filename}`; // ✅ Base URL eklendi
  } else {
    profileImage = "https://via.placeholder.com/150"; // ✅ Varsayılan resim
  }

  // 📌 **Şifre Hashleme**
  const hashedPassword = await bcrypt.hash(password, 10);

  // 📌 **Yeni Kullanıcı Oluşturma**
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role.toLowerCase(),
    phone,
    addresses,
    profileImage,
    bio,
    birthDate,
    socialMedia,
    notifications
  });

  res.status(201).json({
    success: true,
    message: "✅ Kullanıcı başarıyla oluşturuldu!",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
    },
    token: generateToken(user._id, user.role), 
  });
  
});



// ✅ **Kullanıcı Giriş**
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    console.error("❌ Kullanıcı bulunamadı:", email);
    return res.status(401).json({ message: "❌ Geçersiz kimlik bilgileri!" });
  }

  console.log("🔹 Kullanıcının Şifresi:", user.password);
  const isMatch = await bcrypt.compare(password, user.password);
  console.log("✅ Şifre Doğrulama Sonucu:", isMatch);

  if (!isMatch) {
    return res.status(401).json({ message: "❌ Şifre hatalı!" });
  }

  res.status(200).json({
    success: true,
    message: "✅ Giriş başarılı!",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
    },
    token: generateToken(user._id, user.role), // ✅ Bu satır şart!
  });
  
});




// ✅ **Kullanıcı Profili Getirme**
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "❌ Kullanıcı bulunamadı!" });
  }

  res.status(200).json(user);
});

// ✅ **Tüm Kullanıcıları Getirme (Admin)**
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json(users);
});

// ✅ **Tek Bir Kullanıcıyı Getirme (Admin)**
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "❌ Geçersiz kullanıcı ID formatı!" });
  }

  const user = await User.findById(id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "❌ Kullanıcı bulunamadı!" });
  }

  res.status(200).json(user);
});

const BASE_UPLOAD_DIR = "uploads";
const PROFILE_IMAGE_FOLDER = "profile-images";

// 📌 **Kullanıcı Güncelleme**
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let {
    name,
    email,
    role,
    isActive,
    phone,
    bio,
    birthDate,
    socialMedia,
    notifications,
    addresses,
    oldProfileImage,
  } = req.body;

  addresses = addresses ? JSON.parse(addresses) : [];
  socialMedia = socialMedia ? JSON.parse(socialMedia) : {};
  notifications = notifications ? JSON.parse(notifications) : {};

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "❌ Kullanıcı bulunamadı!" });
  }

  let profileImage = user.profileImage;

  // 📌 Yeni resim varsa dosya yükleme işlemi
  if (req.file) {
    profileImage = `${process.env.BASE_URL || "http://localhost:5010"}/uploads/profile-images/${req.file.filename}`;

    // Eski resmi silme işlemi
    if (oldProfileImage && oldProfileImage.includes("/uploads/profile-images/")) {
      const oldImagePath = path.join("uploads/profile-images", path.basename(oldProfileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log("🗑️ Eski profil resmi silindi:", oldImagePath);
      }
    }
  }

  // Güncelleme işlemi
  const updatedUser = await User.findByIdAndUpdate(
    id,
    {
      name,
      email,
      role,
      isActive: isActive === "true",
      phone,
      bio,
      birthDate: birthDate || null,
      socialMedia,
      notifications,
      addresses,
      profileImage,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "✅ Kullanıcı başarıyla güncellendi!",
    user: updatedUser,
  });
});

// ✅ **Kullanıcı Silme (Admin)**
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("Silinecek Kullanıcı ID:", id); // ✅ Hata kaynağını görmek için log ekle

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "❌ Geçersiz kullanıcı ID formatı!" });
  }

  const user = await User.findByIdAndDelete(id); // ✅ Doğru kullanım
  if (!user) {
    return res.status(404).json({ message: "❌ Kullanıcı bulunamadı!" });
  }

  res.status(200).json({ message: "✅ Kullanıcı başarıyla silindi!", userId: id });
});


// ✅ **Şifre Değiştirme**
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");

  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(401).json({ message: "❌ Geçersiz mevcut şifre." });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({ success: true, message: "✅ Şifre başarıyla değiştirildi." });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  let { id } = req.params;

  console.log("📌 Gelen Kullanıcı ID:", id); // 🔥 LOG EKLENDİ

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "❌ Hata: Kullanıcı ID eksik veya geçersiz!" });
  }

  if (!mongoose.Types.ObjectId.isValid(id.trim())) {
    console.log("❌ Hata: Geçersiz ObjectId formatı!");
    return res.status(400).json({ message: "❌ Geçersiz kullanıcı ID formatı!" });
  }

  const user = await User.findById(id.trim());
  if (!user) {
    return res.status(404).json({ message: "❌ Kullanıcı bulunamadı!" });
  }

  user.isActive = !user.isActive;
  await user.save();

  console.log(`✅ Kullanıcı durumu güncellendi: ${user.isActive ? "Aktif" : "Bloklandı"}`);

  return res.status(200).json({
    success: true,
    message: `✅ Kullanıcı başarıyla ${user.isActive ? "aktifleştirildi" : "bloklandı"}!`,
    userId: user._id.toString(),
    isActive: user.isActive,
  });
});


// ✅ **Kullanıcı Rol Güncelleme**
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["admin", "user", "moderator", "customer", "staff"].includes(role)) {
    return res.status(400).json({ message: "❌ Geçersiz rol." });
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });

  if (!user) {
    return res.status(404).json({ message: "❌ Kullanıcı bulunamadı." });
  }

  res.status(200).json({
    success: true,
    message: "✅ Rol başarıyla güncellendi.",
    user,
  });
});


export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, addresses } = req.body;

  const updatedFields = { name, email, phone, addresses };

  const user = await
  User.findByIdAndUpdate(req.user.id, updatedFields, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    return res.status(404).json({ message: "❌ Kullanıcı bulunamadı!" });
  }

  res.status(200).json({
    success: true,
    message: "✅ Kullanıcı başarıyla güncellendi.",
    user,
  });
});



// ✅ **Kullanıcı Profil Resmini Güncelleme**
export const updateProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: "❌ Dosya yüklenmedi!" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "❌ Kullanıcı bulunamadı!" });
    }

    // ✅ Eski resmi sil (eğer varsa)
    if (user.profileImage && user.profileImage.startsWith("uploads")) {
      const oldImagePath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // ✅ Yeni resmi kaydet
    user.profileImage = `uploads/profile-images/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: "✅ Profil resmi güncellendi!",
      profileImage: user.profileImage,
    });
  } catch (error) {
    res.status(500).json({ message: "❌ Sunucu hatası!", error });
  }
};







