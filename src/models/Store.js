import { model, Schema } from "mongoose";

const storeSchema = new Schema({
  name: { type: String, required: true },
  locations: [{ 
    address: String, 
    city: String, 
    country: String,
    postalCode: String 
  }], // 🔹 Çoklu lokasyon desteği eklendi
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  businessHours: { 
    opening: String, // Örn: "08:00"
    closing: String  // Örn: "20:00"
  }, // 🔹 Çalışma saatleri eklendi
  stockLevel: { type: Number, required: true }, // 🔹 Stok seviyesi takip edilebilir hale getirildi
}, { timestamps: true });

const Store = model("Store", storeSchema);
export default Store;
