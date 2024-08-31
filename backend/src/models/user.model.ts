import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  username: string;
  password: string;
  salt: string;
  ignoredUsers: string[]; // Новое поле для хранения списка игнорируемых пользователей
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  ignoredUsers: { type: [String], default: [] }, // Инициализация пустым массивом
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
