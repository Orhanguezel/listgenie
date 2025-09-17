import { model, Schema } from "mongoose";

const invoiceItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true }, // Ürün adı (title)
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
});

const invoiceSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true }, // ✅ Dinamik şirket bilgisi
  items: [invoiceItemSchema],
  totalAmount: { type: Number, required: true },
  taxRate: { type: Number, default: 19 },
  taxAmount: { type: Number, default: 0 },
  issuedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "paid", "overdue"], default: "pending" },
  invoiceNumber: { type: String, unique: true }
}, { timestamps: true });

export default model("Invoice", invoiceSchema);
