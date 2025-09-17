import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";

// ✅ Sistem loglarını getir
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate("adminUser", "name email");
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Loglar alınamadı!", error: error.message });
  }
};





export const createAuditLog = async (req, res) => {
  try {
    const { adminUser, action, targetModel, targetId } = req.body;

    if (!adminUser || !action || !targetModel) {
      return res.status(400).json({ error: "Tüm alanlar zorunludur!" });
    }

    const auditLog = new AuditLog({ adminUser, action, targetModel, targetId });
    await auditLog.save();

    res.status(201).json({ message: "Log kaydedildi!", auditLog });
  } catch (error) {
    res.status(500).json({ message: "Log oluşturulamadı!", error: error.message });
  }
};


// ✅ Yeni bir işlem kaydı oluştur (Admin işlemlerini kaydetmek için)
export const logAction = async (adminUser, action, targetModel, targetId = null) => {
  try {
    const log = new AuditLog({
      adminUser,
      action,
      targetModel,
      targetId,
    });
    await log.save();
    console.log("📌 İşlem loglandı:", action);
  } catch (error) {
    console.error("❌ Log kaydedilirken hata oluştu:", error.message);
  }
};

// ✅ Tüm logları getir (Admin yetkisi gerektirir)
export const getAllLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("adminUser", "name email")
      .sort({ timestamp: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Loglar getirilemedi!", error: error.message });
  }
};

// ✅ Belirli bir admin’in tüm loglarını getir
export const getLogsByAdmin = async (req, res) => {
  try {
    const logs = await AuditLog.find({ adminUser: req.params.adminId })
      .populate("adminUser", "name email")
      .sort({ timestamp: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Admin logları getirilemedi!", error: error.message });
  }
};

// ✅ Belirli bir model için tüm logları getir (örn: "Product", "User")
export const getLogsByModel = async (req, res) => {
  try {
    const logs = await AuditLog.find({ targetModel: req.params.model })
      .populate("adminUser", "name email")
      .sort({ timestamp: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Model logları getirilemedi!", error: error.message });
  }
};

// ✅ Belirli bir işlem kaydını (log) getir
export const getLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate("adminUser", "name email");

    if (!log) {
      return res.status(404).json({ message: "Log bulunamadı!" });
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: "Log getirilirken hata oluştu!", error: error.message });
  }
};

// ✅ Tüm logları temizle (Admin yetkisi gerektirir)
export const deleteAllLogs = async (req, res) => {
  try {
    await AuditLog.deleteMany();
    res.status(200).json({ message: "Tüm loglar başarıyla temizlendi!" });
  } catch (error) {
    res.status(500).json({ message: "Tüm loglar silinemedi!", error: error.message });
  }
};

// ✅ Belirli bir log kaydını sil
export const deleteLogById = async (req, res) => {
  try {
    const log = await AuditLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: "Log bulunamadı!" });

    res.status(200).json({ message: "Log başarıyla silindi!" });
  } catch (error) {
    res.status(500).json({ message: "Log silinemedi!", error: error.message });
  }
};
