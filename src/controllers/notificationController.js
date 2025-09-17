import Notification from "../models/Notification.js";
import User from "../models/User.js";

// ✅ Yeni bildirim oluştur (Eksiksiz)
export const createNotification = async (req, res) => {
  try {
    const { user, type, message } = req.body;

    // Kullanıcı var mı kontrol et
    const existingUser = await User.findById(user);
    if (!existingUser) return res.status(400).json({ message: "Geçersiz kullanıcı ID!" });

    const notification = new Notification({
      user,
      type,
      message,
    });

    await notification.save();
    res.status(201).json({ message: "Bildirim oluşturuldu!", notification });
  } catch (error) {
    res.status(500).json({ message: "Bildirim oluşturulurken hata oluştu!", error: error.message });
  }
};

// ✅ Kullanıcının tüm bildirimlerini getir (En yeni bildirimi en üstte göster)
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 }); // Yeni bildirimler en üstte

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Bildirimler getirilemedi!", error: error.message });
  }
};

// ✅ Admin için tüm kullanıcıların bildirimlerini getir (Geniş kapsamlı)
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Tüm bildirimler getirilemedi!", error: error.message });
  }
};

// ✅ Belirli bir bildirimi okundu olarak işaretle
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });

    if (!notification) return res.status(404).json({ message: "Bildirim bulunamadı!" });

    res.status(200).json({ message: "Bildirim okundu olarak işaretlendi!", notification });
  } catch (error) {
    res.status(500).json({ message: "Bildirim okunamadı!", error: error.message });
  }
};

// ✅ Tüm bildirimleri okundu olarak işaretle
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });

    res.status(200).json({ message: "Tüm bildirimler okundu olarak işaretlendi!" });
  } catch (error) {
    res.status(500).json({ message: "Tüm bildirimleri okundu olarak işaretleme başarısız!", error: error.message });
  }
};

// ✅ Belirli bir bildirimi sil
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ message: "Bildirim bulunamadı!" });

    res.status(200).json({ message: "Bildirim başarıyla silindi!" });
  } catch (error) {
    res.status(500).json({ message: "Bildirim silinemedi!", error: error.message });
  }
};

// ✅ Kullanıcının tüm bildirimlerini sil
export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });

    res.status(200).json({ message: "Tüm bildirimler başarıyla silindi!" });
  } catch (error) {
    res.status(500).json({ message: "Tüm bildirimleri silme başarısız!", error: error.message });
  }
};
