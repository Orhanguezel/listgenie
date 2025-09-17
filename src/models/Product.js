import { model, Schema } from "mongoose";

const productSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    brand: { type: String }, // ✅ Marka eklendi
    price: { type: Number, required: true },
    discountPrice: { type: Number }, // ✅ İndirimli fiyat alanı
    stock: { type: Number, required: true },
    sku: { type: String, unique: true }, // ✅ Stok Kodu (SKU) eklendi
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    unit: { type: String, enum: ["kg", "lt", "adet"], default: "adet" }, // ✅ Ölçü birimi eklendi
    images: [{ type: String }]
  },
  { timestamps: true }
);

const Product = model("Product", productSchema);
export default Product;
