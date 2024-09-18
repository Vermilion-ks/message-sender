import React, { FC, useState } from "react";
import s from "./style.module.css";
import Spinner from "../Spinner/Spinner";

const FindForm: FC<{
  dialogId: number;
  phone: string;
  onSend: (phone: string, dialogId: number, message: string) => Promise<void>;
  onClose: () => void;
}> = ({ dialogId, phone, onSend }) => {
  const [message, setMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  //const [count, setCount] = useState<number>(5);

  const handleSend = () => {
    setIsSending(true);
    onSend(phone, dialogId, message)
      .then(() => {
        //setMessage("");
        setIsSending(false);
      })
      .catch(() => {
        setIsSending(false);
      });
  };

  return (
    <div className={s.messageForm}>
      <div className={s.sleepTime}>
        {/* <div className={s.sleepTimeText}>
          Задержка между отправкой сообщений в секундах:
        </div>
        <div>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min="5"
            className={s.messageCount}
          />
        </div> */}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Введите сообщение..."
        disabled={isSending} // Отключаем поле ввода при отправке
      />
      <div className={s.buttonContainer}>
        {isSending ? (
          <Spinner /> // Показываем спиннер вместо кнопки
        ) : (
          <button
            onClick={handleSend}
            disabled={message.trim().length === 0} // Отключаем кнопку, если поле пустое
          >
            Отправить сообщение
          </button>
        )}
      </div>
    </div>
  );
};

export default FindForm;
