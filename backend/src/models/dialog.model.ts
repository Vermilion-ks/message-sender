import mongoose, { Document, Schema } from "mongoose";

interface Dialog extends Document {
  dialogId: string;
  participants: { userId: string; username: string }[]; // Измененный формат
}

const DialogSchema: Schema = new Schema({
  dialogId: { type: String, required: true },
  participants: [
    {
      userId: { type: String, required: true },
      username: { type: String, required: true },
    },
  ],
});

export default mongoose.model<Dialog>("Dialog", DialogSchema);
