import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  username: string;
  password: string;
  salt: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
