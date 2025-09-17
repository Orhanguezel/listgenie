import { model, Schema } from "mongoose";

const shipmentSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  trackingNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "shipped", "delivered", "returned"], default: "pending" },
  estimatedDelivery: { type: Date },
  carrier: { type: String }, // DHL, UPS vb.
  carrierDetails: {
    company: String, // Taşıyıcı şirket
    contactNumber: String, // Taşıyıcı şirket telefonu
  },
  recipientName: { type: String, required: true }, // Kargoyu teslim alacak kişi
  deliveryType: { type: String, enum: ["standard", "express", "same-day"], default: "standard" }, // Kargo tipi eklendi
}, { timestamps: true });

const Shipment = model("Shipment", shipmentSchema);
export default Shipment;

