import mongoose, { Document, Schema } from "mongoose";

interface Dialog extends Document {
  dialogId: string;
  participants: string[];
}

const DialogSchema: Schema = new Schema({
  dialogId: { type: String, required: true },
  participants: { type: [String], default: [] },
});

export default mongoose.model<Dialog>("Dialog", DialogSchema);
