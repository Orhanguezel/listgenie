import { model, Schema } from "mongoose";

const companySchema = new Schema(
  {
    companyName: { type: String, required: true, unique: true },
    taxNumber: { type: String, required: true },
    handelsregisterNumber: { type: String, required: false }, // ✅ Ticaret Sicil Numarası eklendi
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    bankDetails: {
      bankName: { type: String, required: true },
      iban: { type: String, required: true },
      swiftCode: { type: String, required: true },
    },
    logoUrl: { type: String, required: false }, // ✅ Şirket logosu için URL alanı eklendi
  },
  { timestamps: true }
);

export default model("Company", companySchema);
