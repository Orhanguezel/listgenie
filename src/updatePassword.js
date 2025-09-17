import bcrypt from "bcryptjs"; // ✅ bcryptjs kullan
import mongoose from "mongoose";
import User from "./models/User.js"; // ✅ Kullanıcı modelini içe aktar
import dotenv from "dotenv";
dotenv.config();

const MONGO_URL = process.env.MONGO_URI;

// MongoDB'ye bağlan
mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB'ye bağlanıldı.");
  }
  )
  .catch((error) => {
    console.error("❌ MongoDB bağlantısı başarısız oldu:", error);
  }
  );

async function updatePassword() {
  try {
    const email = "admin@mdhygiene.com"; // Güncellenecek admin e-posta
    const plainPassword = "Admin123!"; // Yeni şifre
    const hashedPassword = await bcrypt.hash(plainPassword, 10); // Şifreyi hashle

    // Kullanıcıyı güncelle
    const result = await User.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log("⚠️ Kullanıcı bulunamadı!");
    } else {
      console.log("✅ Admin şifresi başarıyla güncellendi!", result);
    }
  } catch (error) {
    console.error("❌ Şifre güncellenirken hata oluştu:", error);
  } finally {
    mongoose.disconnect();
    console.log("🔌 MongoDB bağlantısı kapatıldı.");
  }
}

// ✅ Şifre güncelleme işlemini başlat
updatePassword();


