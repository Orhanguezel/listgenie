import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      match: /.+\@.+\..+/ 
    },
    password: { type: String, required: true, select: false },
    role: { 
      type: String, 
      enum: ["admin", "user", "customer", "moderator", "staff"], 
      default: "user" 
    },
    addresses: [
      {
        street: String,
        city: String,
        postalCode: String,
        country: String,
        isDefault: { type: Boolean, default: false },
      }
    ],
    phone: { type: String },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    profileImage: { type: String, default: "https://via.placeholder.com/150" },
    isActive: { type: Boolean, default: true },
    favorites: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    bio: { type: String, default: "" }, 
    birthDate: { type: Date },
    socialMedia: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" }
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
    }
  },
  { timestamps: true }
);

// ✅ **Şifreyi kaydetmeden önce hashle**
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Şifre değiştirilmemişse, tekrar hashleme

  // Eğer şifre zaten hashlenmişse tekrar hashleme
  if (this.password.startsWith("$2b$10$")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


// ✅ **Şifre doğrulama metodu**
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false; // Eğer hata olursa giriş başarısız kabul edilir
  }
};

// ✅ **Şifre hashlenmiş mi kontrol et**
userSchema.methods.isPasswordHashed = function () {
  return this.password.startsWith("$2b$10$"); // bcrypt hash formatı kontrolü
};

const User = model("User", userSchema);
export default User;
