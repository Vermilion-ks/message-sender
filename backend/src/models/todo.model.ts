import mongoose, { Document, Schema } from "mongoose";

export interface Profile extends Document {
  userId: string;
  phone?: string;
  session?: string;
  firstName: string;
  lastName: string;
  sessionActive?: boolean;
}

const profileSchema: Schema = new Schema({
  userId: { type: String, required: true },
  phone: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  session: { type: String },
  sessionActive: { type: Boolean, default: false },
});

const TodoModel = mongoose.model<Profile>("Profile", profileSchema);

export default TodoModel;
