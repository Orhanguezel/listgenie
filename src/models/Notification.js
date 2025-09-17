import { model, Schema } from "mongoose";

const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["order", "payment", "shipment"], required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  }, { timestamps: true });
  
  const Notification = model("Notification", notificationSchema);
  export default Notification;
  