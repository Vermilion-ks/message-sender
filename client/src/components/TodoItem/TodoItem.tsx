import React, { FC, useEffect, useState } from "react";
import s from "./style.module.css";
import { Profile } from "../../models/Profile";
import todoService from "../../services/todosService";
import { Trash } from "react-bootstrap-icons";

const TodoComponent: FC<ProfileProps> = ({
  profile,
  setTodos,
  userId,
  onUserClick,
  isSelected,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  function deleteTodo() {
    todoService
      .deleteTodoById(profile._id)
      .then(() => {
        todoService
          .getTodosByUserId(userId)
          .then((res) => {
            setTodos(res.data);
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const phoneWithoutPlus = profile.phone.replace(/\+/g, "");
  const imageUrl = `http://localhost:8081/pictures/${phoneWithoutPlus}.jpg`;

  return (
    <>
      <div
        className={`${s.container} ${isSelected ? s.selected : ""} ${
          isAnimating ? s.animating : ""
        }`}
        onClick={onUserClick}
      >
        <img className={s.image} src={imageUrl} alt="Profile" />
        <div className={s.info}>
          <div className={s.name}>
            {profile.firstName} {profile.lastName}
          </div>
          <div className={s.phone}>{profile.phone}</div>
        </div>
      </div>
      {/* <button className={s.deleteButton} onClick={deleteTodo}>
        <Trash size={20} color="red" />
      </button> */}
    </>
  );
};

interface ProfileProps {
  profile: Profile;
  setTodos: React.Dispatch<React.SetStateAction<Profile[]>>;
  userId: string;
  onUserClick: () => void;
  isSelected: boolean;
}

export default TodoComponent;
