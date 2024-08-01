import { Link, useNavigate } from "react-router-dom";
import React, { FC } from "react";
import { User } from "../../models/User";
import { Messenger, PersonPlusFill } from "react-bootstrap-icons";
import s from "./style.module.css";

const NavigationBar: FC<NavigationBarProps> = ({
  user,
  setLoginUser,
  setShowForm,
}: NavigationBarProps) => {
  const navigate = useNavigate();

  const logout = () => {
    setLoginUser(null);
    navigate("/", { replace: true });
  };

  return (
    <>
      <Link to={"/"} className={"nav-item"}>
        <button className={s.btn}>
          <Messenger size={30} color="#666" />
        </button>
      </Link>
      <button
        className={s.btn}
        onClick={() => setShowForm(true)} // Показываем форму добавления
      >
        <PersonPlusFill size={30} color="#666" />
      </button>
    </>
  );
};

interface NavigationBarProps {
  user: User;
  setLoginUser: React.Dispatch<React.SetStateAction<User>>;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>; // Передача метода для отображения формы
}

export default NavigationBar;
