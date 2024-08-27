import React, { FC, useState } from "react";
import s from "./style.module.css";
import Spinner from "../Spinner/Spinner";

const FindForm: FC<{
  dialogId: number;
  phone: string;
  onSend: (
    phone: string,
    dialogId: number,
    name: string, // Добавлено имя пользователя
    count: number
  ) => Promise<void>;
  onClose: () => void;
}> = ({ dialogId, phone, onSend, onClose }) => {
  const [sortedName, setSortedName] = useState<string>(""); // Переименовано для ясности
  const [isSending, setIsSending] = useState<boolean>(false);
  const [count, setCount] = useState<number>(1);

  const handleSend = () => {
    setIsSending(true);
    onSend(phone, dialogId, sortedName, count) // Передаём имя пользователя в onSend
      .then(() => {
        setIsSending(false);
        setCount(1);
        setSortedName(""); // Очищаем поле ввода имени после отправки
      })
      .catch(() => {
        setIsSending(false);
      });
  };

  return (
    <div className={s.messageForm}>
      <div className={s.countForm}>
        <span className={s.countText}>
          Количество пользователей для поиска:
        </span>
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          min="1"
          className={s.messageCount}
        />
      </div>
      <div className={s.countForm}>
        <span className={s.countText}>Фильтр по имени (может быть пустым)</span>
        <input
          type="text"
          value={sortedName}
          onChange={(e) => setSortedName(e.target.value)}
          placeholder="Имя пользователя"
          className={s.messageName}
        />
      </div>
      <div className={s.buttonContainer}>
        {isSending ? <Spinner /> : <button onClick={handleSend}>Поиск</button>}
      </div>
    </div>
  );
};

export default FindForm;
