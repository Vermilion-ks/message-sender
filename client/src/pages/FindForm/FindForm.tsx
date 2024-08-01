import React, { FC, useState } from "react";
import s from "./style.module.css";
import Spinner from "../Spinner/Spinner";

const FindForm: FC<{
  dialogId: number;
  phone: string;
  onSend: (
    phone: string,
    dialogId: number,
    //message: string,
    count: number
  ) => Promise<void>;
  onClose: () => void;
}> = ({ dialogId, phone, onSend, onClose }) => {
  const [message, setMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [count, setCount] = useState<number>(1);

  const handleSend = () => {
    setIsSending(true);
    onSend(phone, dialogId, count)
      .then(() => {
        //setMessage("");
        setIsSending(false);
        setCount(1);
      })
      .catch(() => {
        setIsSending(false);
      });
  };

  return (
    <div className={s.messageForm}>
      <input
        type="number"
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        min="1"
        className={s.messageCount}
      />
      {/* <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Введите сообщение..."
        disabled={isSending} // Отключаем поле ввода при отправке
      /> */}
      <div className={s.buttonContainer}>
        {isSending ? (
          <Spinner /> // Показываем спиннер вместо кнопки
        ) : (
          <button
            onClick={handleSend}
            //disabled={message.trim().length === 0} // Отключаем кнопку, если поле пустое
          >
            Поиск
          </button>
        )}
      </div>
    </div>
  );
};

export default FindForm;
