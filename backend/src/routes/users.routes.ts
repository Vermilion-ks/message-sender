import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";

const userRoutes = express.Router();

// Логин пользователя
userRoutes.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    console.log(user);
    if (!user) return res.status(404).send("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.send({ message: "Login successful", user });
    } else {
      res.status(400).send("Invalid credentials");
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Регистрация пользователя
userRoutes.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send("User already exists");

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hash,
      salt,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    res.status(500).json("Server error");
  }
});

export default userRoutes;
