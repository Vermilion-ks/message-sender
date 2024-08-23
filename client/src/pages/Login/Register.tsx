import React, { FC, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "react-bootstrap-icons";
import s from "./style.module.css";
import loginService from "../../services/loginService";
import { User } from "../../models/User";
import { AxiosResponse } from "axios";

const Register: FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({
    username: "",
    password: "",
  });

  const [repeatPassword, setRepeatPassword] = useState("");

  const handleChangeUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUser({
      ...user,
      username: event.target.value,
    });
  };

  const handleChangePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUser({
      ...user,
      password: event.target.value,
    });
  };

  const handleChangePasswordRepeat = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRepeatPassword(event.target.value);
  };

  function registerNewUser() {
    if (user.password === repeatPassword) {
      if (user.password.length >= 1) {
        console.log("Registering user:", user);
        loginService
          .register({ username: user.username, password: user.password })
          .then((res: AxiosResponse<User>) => {
            console.log("Response:", res);
            navigate("/Login");
          })
          .catch((error) => {
            console.log("Registration error:", error);
            toast.error("User register error");
          });
      } else {
        toast.error("Password must be at least 1 character long");
      }
    } else {
      toast.error("Passwords do not match");
    }
  }

  return (
    <div className={s.container}>
      <div className={s["login-form"]}>
        <h3>Создать аккаунт</h3>
        <input
          type={"text"}
          placeholder={"Login"}
          className={`form-control ${s["input-form"]}`}
          onChange={handleChangeUsername}
        />
        <input
          type={"password"}
          placeholder={"Password"}
          className={`form-control ${s["input-form"]}`}
          onChange={handleChangePassword}
        />
        <input
          type={"password"}
          placeholder={"Repeat password"}
          className={`form-control ${s["input-form"]}`}
          onChange={handleChangePasswordRepeat}
        />
        <button
          className={`btn ${s["btn-warning"]} ${s["btn-register"]}`}
          onClick={() => navigate("/Login")}
        >
          <ChevronLeft size={20} color="#666" />
        </button>
        <button
          className={`btn ${s["btn-primary"]}`}
          disabled={
            user.username === "" ||
            user.password === "" ||
            repeatPassword === ""
          }
          onClick={registerNewUser}
        >
          Зарегистрироваться
        </button>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={true}
        newestOnTop={true}
        rtl={false}
        theme="dark"
      />
    </div>
  );
};

export default Register;
