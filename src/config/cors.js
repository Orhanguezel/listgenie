import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS hatası: Erişime izin verilmeyen kaynak!"), false);
    }
  },
  credentials: true,
};

export default cors(corsOptions);
