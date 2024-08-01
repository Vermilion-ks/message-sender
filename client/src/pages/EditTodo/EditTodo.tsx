import { SaveFill, TrashFill } from "react-bootstrap-icons";
import React, { FC, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditTodo.css";
import { toast } from "react-toastify";
import todoService from "../../services/todosService";
import { Profile } from "../../models/Profile";

const EditTodo: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [todo, setTodo] = useState<Profile>({
    userId: "",
    phone: "",
  });

  useEffect(() => {
    todoService
      .getTodoById(id)
      .then((res) => {
        setTodo({
          phone: res.data.phone,
          userId: id,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }, [id]);

  const onChangePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTodo({
      ...todo,
      phone: e.target.value,
    });
  };

  const updateTodoById = () => {
    if (todo.phone.length > 0) {
      todoService
        .updateTodo(todo, id)
        .then((res) => {
          console.log("updated Todo successfully!", res);
          toast.info("updated Todo");
          navigate("/");
        })
        .catch((err) => {
          navigate("/");
          console.log(err);
          toast.error("error updating todo");
        });
    }
  };

  const deleteTodo = () => {
    todoService
      .deleteTodoById(id)
      .then((res) => {
        console.log("deleted todo:", res.data);
        toast.info("Deleted Todo");
        navigate("/");
      })
      .catch((err) => {
        navigate("/");
        console.log(err);
        toast.error("error deleting todo");
      });
  };

  return (
    <div className={"EditTodo"}>
      <h4>Update Todo:</h4>
      <input
        className={"form-control"}
        type={"text"}
        value={todo.phone}
        placeholder="Description"
        onChange={onChangePhone}
      />

      <button className={"btn btn-danger btn-edit"} onClick={deleteTodo}>
        <label>
          <TrashFill />
          Delete
        </label>
      </button>
      <button className={"btn btn-primary btn-edit"} onClick={updateTodoById}>
        <label>
          <SaveFill />
          Save
        </label>
      </button>
    </div>
  );
};

export default EditTodo;
