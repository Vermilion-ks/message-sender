import React, { FC, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import todoService from "../../services/todosService";
import { Profile } from "../../models/Profile";
import Spinner from "../Spinner/Spinner";
import s from "./style.module.css";
import t from "../toast.module.css";

interface AddingTodoProps {
  userId: string;
  onClose: () => void;
  onTodoAdded: () => void;
}

const AddingTodo: FC<AddingTodoProps> = ({ userId, onClose, onTodoAdded }) => {
  const [todo, setTodo] = useState<Profile>({
    userId,
    phone: "",
  });
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onChangePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTodo({
      ...todo,
      phone: e.target.value,
    });
  };

  const onChangeCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
  };

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const sendCode = () => {
    setLoading(true);
    todoService
      .sendCode(todo.phone)
      .then(() => {
        setStep("code");
      })
      .catch((err: Error) => {
        console.log(err);
        toast.error("Ошибка отправки кода", {
          className: t.customToast,
          bodyClassName: t.customToastBody,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const validateCode = () => {
    setLoading(true);
    todoService
      .validateCode(todo.phone, code, password)
      .then(() => {
        todoService
          .addProfile(todo)
          .then(() => {
            toast.success("Учетная запись добавлена");
            onTodoAdded();
            onClose(); // Закрываем форму добавления
          })
          .catch((err: Error) => {
            console.log(err);
            toast.error(err.message);
          });
      })
      .catch((err: Error) => {
        console.log(err);
        toast.error("Не верный код подтверждения");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Modal show={true} onHide={onClose}>
      <Modal.Body className={s.modalBody}>
        {step === "phone" ? (
          <>
            <input
              className={`${s.modalInput} form-control`}
              type="text"
              placeholder="Номер телефона"
              value={todo.phone}
              onChange={onChangePhone}
            />
            {loading ? (
              <Spinner />
            ) : (
              <button
                disabled={todo.phone.trim() === ""}
                className={`${s.btnAdd} btn btn-primary`}
                onClick={sendCode}
              >
                Добавить
              </button>
            )}
          </>
        ) : (
          <>
            <input
              className={`${s.modalInput} form-control`}
              type="text"
              placeholder="Код полученный в сообщении"
              value={code}
              onChange={onChangeCode}
            />
            <hr></hr>
            <input
              className={`${s.modalInput} form-control`}
              type="text"
              placeholder="Пароль 2FA (если установлен)"
              value={password}
              onChange={onChangePassword}
            />
            {loading ? (
              <Spinner />
            ) : (
              <Button
                className={`${s.btnAdd} btn btn-primary`}
                variant="primary"
                onClick={validateCode}
                disabled={code.trim() === ""}
              >
                Подтвердить код
              </Button>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default AddingTodo;
