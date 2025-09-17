import Company from "../models/Company.js";

// ✅ **Tüm şirket bilgilerini getir (İlk şirketi döndür)**
export const getCompanyInfo = async (req, res) => {
  try {
    const company = await Company.findOne(); // **İlk şirketi getir**
    if (!company) {
      return res.status(404).json({ message: "🚨 Şirket bilgisi bulunamadı!" });
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: "🚨 Şirket bilgileri yüklenirken hata oluştu!", error: error.message });
  }
};

// ✅ **Şirket bilgilerini güncelle**
export const updateCompanyInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCompany = await Company.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedCompany) {
      return res.status(404).json({ message: "🚨 Şirket bilgisi bulunamadı!" });
    }

    res.status(200).json(updatedCompany);
  } catch (error) {
    res.status(500).json({ message: "🚨 Şirket bilgileri güncellenirken hata oluştu!", error: error.message });
  }
};

// ✅ **Yeni şirket ekle (Sadece bir şirket olacak)**
export const createCompany = async (req, res) => {
  try {
    const existingCompany = await Company.findOne();
    if (existingCompany) {
      return res.status(400).json({ message: "🚨 Zaten bir şirket kaydı mevcut!" });
    }

    const newCompany = new Company(req.body);
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ message: "🚨 Şirket eklenirken hata oluştu!", error: error.message });
  }
};
