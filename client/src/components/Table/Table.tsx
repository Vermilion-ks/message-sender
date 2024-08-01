import React, { FC } from "react";
import "./Table.css";

/**
 * Table holds the To-do items
 * @param props todoList: list of to-do table entries
 * @returns {JSX.Element}
 */
const Table: FC<TableProps> = ({ todoLength, todoList }) => {
  return (
    <div className={todoLength > 0 ? "table-todo" : "not-empty table-todo"}>
      <table className={"table table-striped"}>
        <thead>
          <tr></tr>
        </thead>
        <tbody>{todoList()}</tbody>
      </table>
    </div>
  );
};

interface TableProps {
  todoLength: number;
  todoList: () => JSX.Element[];
}

export default Table;
