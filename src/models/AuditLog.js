import { model, Schema } from "mongoose";

const auditLogSchema = new Schema({
  adminUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  targetModel: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, refPath: "targetModel" },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

const AuditLog = model("AuditLog", auditLogSchema);

export default AuditLog;
