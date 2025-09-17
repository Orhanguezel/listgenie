import { model, Schema } from "mongoose";

const offerSchema = new Schema(
  {
    offerNumber: { 
      type: String, 
      unique: true, 
      required: true 
    }, // ✅ Teklif numarası benzersiz olacak

    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    }, // ✅ Teklifi oluşturan kişi (admin veya yetkili)

    company: { 
      type: Schema.Types.ObjectId, 
      ref: "Company", 
      required: true 
    }, // ✅ Teklifin sunulduğu şirket (bizim firmamız)

    customer: { 
      type: Schema.Types.ObjectId, 
      ref: "Customer", 
      required: true 
    }, // ✅ Teklifin gönderildiği müşteri firması

    items: [
      {
        product: { 
          type: Schema.Types.ObjectId, 
          ref: "Product", 
          required: true 
        }, // ✅ Ürün bilgileri ürün tablosundan çekilecek
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        customPrice: { type: Number, required: true } // ✅ Ürün için özel teklif fiyatı
      }
    ],

    totalAmount: { 
      type: Number, 
      required: true 
    }, // ✅ Teklifin toplam tutarı (vergi dahil)

    taxAmount: { 
      type: Number, 
      default: 0 
    }, // ✅ KDV tutarı

    taxRate: { 
      type: Number, 
      enum: [7, 19], 
      default: 19 
    }, // ✅ Vergi oranı (%7 veya %19 seçilebilir)

    shippingCost: { 
      type: Number, 
      default: 0 
    }, // ✅ Nakliye bedeli

    paymentTerms: { 
      type: String, 
      default: "30 gün içinde ödeme" 
    }, // ✅ Ödeme şartları eklendi

    status: { 
      type: String, 
      enum: ["draft", "preparing", "sent", "pending", "approved", "rejected"], 
      default: "draft" 
    }, // ✅ Teklifin durumu genişletildi

    validUntil: { 
      type: Date, 
      required: true 
    }, // ✅ Teklifin geçerlilik süresi

    notes: { 
      type: String, 
      default: "" 
    }, // ✅ Özel notlar veya ek açıklamalar

    sentByEmail: { 
      type: Boolean, 
      default: false 
    }, // ✅ Teklifin e-posta ile gönderilip gönderilmediği

    pdfLink: { 
      type: String, 
      default: "" 
    }, // ✅ Teklif PDF olarak oluşturulup sistemde saklanabilir

    createdAt: { 
      type: Date, 
      default: Date.now 
    } // ✅ Otomatik zaman damgası

  }, 
  { timestamps: true }
);

export default model("Offer", offerSchema);
