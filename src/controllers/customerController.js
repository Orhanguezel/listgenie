import Customer from "../models/Customer.js";

// ✅ **Tüm müşterileri getir**
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "🚨 Müşteriler getirilirken hata oluştu!", error: error.message });
  }
};

// ✅ **Belirli bir müşteriyi getir**
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "🚨 Müşteri bulunamadı!" });

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: "🚨 Müşteri getirilirken hata oluştu!", error: error.message });
  }
};

// ✅ **Yeni müşteri ekle**
export const createCustomer = async (req, res) => {
  try {
    const { companyName, contactName, email, phone, address } = req.body;
    if (!companyName || !contactName || !email || !phone || !address) {
      return res.status(400).json({ message: "🚨 Tüm müşteri bilgileri zorunludur!" });
    }

    const newCustomer = new Customer({ companyName, contactName, email, phone, address });
    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ message: "🚨 Müşteri eklenirken hata oluştu!", error: error.message });
  }
};

// ✅ **Müşteri bilgilerini güncelle**
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCustomer = await Customer.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedCustomer) {
      return res.status(404).json({ message: "🚨 Müşteri bulunamadı!" });
    }

    res.status(200).json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: "🚨 Müşteri güncellenirken hata oluştu!", error: error.message });
  }
};

// ✅ **Müşteriyi sil**
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(404).json({ message: "🚨 Müşteri bulunamadı!" });
    }

    res.status(200).json({ message: "✅ Müşteri başarıyla silindi!", id });
  } catch (error) {
    res.status(500).json({ message: "🚨 Müşteri silinirken hata oluştu!", error: error.message });
  }
};
