import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import EditTodo from "../pages/EditTodo/EditTodo";
import TodoList from "../pages/TodoList/TodoList";
import PageNotFound from "../pages/PageNotFound/PageNotFound";
import React, { FC, useState } from "react";
import Login from "../pages/Login/Login";
import Register from "../pages/Login/Register";
import { ToastContainer } from "react-toastify";
import { User } from "../models/User";
import AddingTodo from "../pages/AddingTodo/AddingTodo";

const App: FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAddingTodo, setShowAddingTodo] = useState(false);

  function setLoginUser(user: User) {
    setUser(user);
  }

  function openAddingTodo() {
    setShowAddingTodo(true);
  }

  function closeAddingTodo() {
    setShowAddingTodo(false);
  }

  function handleTodoAdded() {
    // Реализуйте логику обновления списка задач, если необходимо
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path={"/"}>
          <Route
            index
            element={
              user && user._id ? (
                <>
                  <TodoList user={user} setLoginUser={setLoginUser} />
                  {showAddingTodo && (
                    <AddingTodo
                      userId={user._id}
                      onClose={closeAddingTodo}
                      onTodoAdded={handleTodoAdded} // Передаем проп onTodoAdded
                    />
                  )}
                </>
              ) : (
                <Login setLoginUser={setLoginUser} />
              )
            }
          />
          <Route path={"/edit/:id"} element={<EditTodo />} />
          <Route path={"*"} element={<PageNotFound />} />
          <Route
            path="/Login"
            element={<Login setLoginUser={setLoginUser} />}
          />
          <Route path="/Register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
