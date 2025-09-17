import jwt from "jsonwebtoken";

// ✅ **Token Üretme Fonksiyonu**
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: "30d" }
  );
};
