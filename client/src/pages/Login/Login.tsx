import React, { FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import s from "./style.module.css";
import loginService from "../../services/loginService";
import { User } from "../../models/User";
import { AxiosResponse } from "axios";

const Login: FC<LoginProps> = ({ setLoginUser }: LoginProps) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({
    username: "",
    password: "",
    salt: "",
  });

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUser({
      ...user,
      username: event.target.value,
    });
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUser({
      ...user,
      password: event.target.value,
    });
  };

  const loginUser = () => {
    loginService
      .login({
        username: user.username.trim(),
        password: user.password.trim(),
      })
      .then((response: AxiosResponse<User>) => {
        setLoginUser(response.data["user"] as User);
        navigate("/", { replace: true });
      })
      .catch((err: Error) => {
        console.log(err.message);
        if (err.message.includes("404")) {
          toast.error("Пользователь не существует");
        } else {
          toast.error("Не верный пароль");
        }
      });
  };

  const goToRegister = () => {
    navigate("/Register");
  };

  return (
    <div className={s.container}>
      <div className={s["login-form"]}>
        <h3>Авторизация</h3>
        <input
          type={"text"}
          className={`form-control ${s["input-form"]}`}
          placeholder={"Login"}
          onChange={handleUsernameChange}
        />
        <input
          type={"password"}
          className={`form-control ${s["input-form"]}`}
          placeholder={"Password"}
          onChange={handlePasswordChange}
        />

        <button className={`btn ${s["btn-warning"]}`} onClick={goToRegister}>
          Регистрация
        </button>
        <button className={`btn ${s["btn-primary"]}`} onClick={loginUser}>
          Авторизация
        </button>
        <ToastContainer
          position="top-center"
          autoClose={2000}
          hideProgressBar={true}
          newestOnTop={true}
          rtl={false}
          theme="dark"
        />
      </div>
    </div>
  );
};

interface LoginProps {
  setLoginUser: (user: User) => void;
}

export default Login;
