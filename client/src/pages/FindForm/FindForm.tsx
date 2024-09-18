import React, { FC, useState } from "react";
import s from "./style.module.css";
import Spinner from "../Spinner/Spinner";

const FindForm: FC<{
  dialogId: number;
  phone: string;
  onSend: (
    phone: string,
    dialogId: number,
    firstName: string,
    lasttName: string,
    count: number,
    isPremium: boolean
  ) => Promise<void>;
  onClose: () => void;
}> = ({ dialogId, phone, onSend, onClose }) => {
  const [sortedFirstName, setSortedFirstName] = useState<string>("");
  const [sortedLastName, setSortedLastName] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [count, setCount] = useState<number>(1);
  const [isPremium, setIsPremium] = useState<boolean>(false);

  const handleSend = () => {
    setIsSending(true);
    onSend(phone, dialogId, sortedFirstName, sortedLastName, count, isPremium)
      .then(() => {
        setIsSending(false);
        setCount(1);
        setSortedFirstName("");
        setSortedLastName("");
        setIsPremium(false);
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
          type="text"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          placeholder="Имя пользователя"
          className={s.messageName}
        />
      </div>
      <div className={s.countForm}>
        <span className={s.countText}>Фильтр по имени (может быть пустым)</span>
        <input
          type="text"
          value={sortedFirstName}
          onChange={(e) => setSortedFirstName(e.target.value)}
          placeholder="Имя пользователя"
          className={s.messageName}
        />
      </div>
      <div className={s.countForm}>
        <span className={s.countText}>
          Фильтр по фамилии (может быть пустым)
        </span>
        <input
          type="text"
          value={sortedLastName}
          onChange={(e) => setSortedLastName(e.target.value)}
          placeholder="Фамилия пользователя"
          className={s.messageName}
        />
      </div>
      <div className={s.countForm}>
        <span className={s.countText}>Только Premium пользователи</span>
        <input
          type="checkbox"
          checked={isPremium}
          onChange={(e) => setIsPremium(e.target.checked)}
          className={s.checkbox}
        />
      </div>
      <div className={s.buttonContainer}>
        {isSending ? <Spinner /> : <button onClick={handleSend}>Поиск</button>}
      </div>
    </div>
  );
};

export default FindForm;
