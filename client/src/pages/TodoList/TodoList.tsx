import React, { FC, useEffect, useState } from "react";
import s from "./style.module.css";
import TodoComponent from "../../components/TodoItem/TodoItem";
import { toast, ToastContainer } from "react-toastify";
import Table from "../../components/Table/Table";
import NavigationBar from "../NavigationBar/NavigationBar";
import Spinner from "../Spinner/Spinner";
import FindForm from "../FindForm/FindForm";
import MessageForm from "../MessageForm/MessageForm";
import todoService from "../../services/todosService";
import { User } from "../../models/User";
import { Profile } from "../../models/Profile";
import AddingTodo from "../AddingTodo/AddingTodo"; // Импортируйте AddingTodo
import { PersonPlusFill } from "react-bootstrap-icons";
import { API_BASE_URL } from "../../services/consts";

export interface Participant {
  accessHash: string;
  applyMinPhoto: boolean;
  attachMenuEnabled: boolean;
  bot: boolean;
  botAttachMenu: boolean;
  botBusiness: boolean;
  botCanEdit: boolean;
  botChatHistory: boolean;
  botInfoVersion: number | null;
  botInlineGeo: boolean;
  botInlinePlaceholder: string | null;
  botNochats: boolean;
  className: string;
  closeFriend: boolean;
  color: string | null;
  contact: boolean;
  contactRequirePremium: boolean;
  deleted: boolean;
  emojiStatus: string | null;
  fake: boolean;
  firstName: string;
  flags: number;
  flags2: number;
  id: string;
  langCode: string | null;
  lastName: string | null;
  min: boolean;
  mutualContact: boolean;
  phone: string | null;
  photo: {
    flags: number;
    hasVideo: boolean;
    personal: boolean;
    photoId: string;
    strippedThumb: object;
  };
  premium: boolean;
  profileColor: string | null;
  restricted: boolean;
  restrictionReason: string | null;
  scam: boolean;
  self: boolean;
  status: {
    flags: number;
    byMe: boolean;
    className: string;
  };
  storiesHidden: boolean;
  storiesMaxId: number | null;
  storiesUnavailable: boolean;
  support: boolean;
  username: string;
  usernames: string | null;
  verified: boolean;
}

interface Integer {
  value: bigint;
}

interface ChatPhoto {
  CONSTRUCTOR_ID: number;
  SUBCLASS_OF_ID: number;
  className: string;
  classType: string;
  flags: number;
  hasVideo: boolean;
  photoId: Integer[];
  strippedThumb: Buffer;
  dcId: number;
}

const TodoList: FC<TodoListProps> = ({ user, setLoginUser }: TodoListProps) => {
  const [todos, setTodos] = useState<Profile[]>([]);
  const [dialogs, setDialogs] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [selectedDialogId, setSelectedDialogId] = useState<number | null>(null);
  const [showFindForm, setShowFindForm] = useState<boolean>(false);
  const [loadingDialogs, setLoadingDialogs] = useState<boolean>(false);
  const [loadingTodos, setLoadingTodos] = useState<boolean>(false);
  const [showAddingTodo, setShowAddingTodo] = useState<boolean>(false);
  const [dialogParticipantsCount, setDialogParticipantsCount] = useState<
    number | null
  >(null);
  const [dialogTitle, setDialogTitle] = useState<string>("");
  const [joinDate, setJoinDate] = useState<number>(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [commonChats, setCommonChats] = useState<
    { userId: string; chats: any[] }[]
  >([]);
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
  const [expandedParticipant, setExpandedParticipant] = useState(null);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    setLoadingTodos(true);
    todoService
      .getTodosByUserId(user._id)
      .then((res) => {
        setTodos(res.data);
      })
      .catch((err: Error) => {
        console.error(err);
        toast.error(err.message);
      })
      .finally(() => {
        setLoadingTodos(false);
      });
  }, [user._id]);
  const filteredDialogues = dialogs.filter((dialog) =>
    dialog.title.toLowerCase().includes(filterText.toLowerCase())
  );
  const handleTodoAdded = () => {
    setLoadingTodos(true);
    todoService
      .getTodosByUserId(user._id)
      .then((res) => {
        setTodos(res.data);
      })
      .catch((err: Error) => {
        console.error(err);
        toast.error(err.message);
      })
      .finally(() => {
        setLoadingTodos(false);
      });
  };

  const handleUserClick = (phone: string, profileId: string) => {
    setSelectedProfileId(profileId);
    setLoadingDialogs(true);
    setSelectedDialogId(null);
    setShowFindForm(false);
    todoService
      .activateSession(phone)
      .then((res) => {
        setLoginUser((prevUser) => ({
          ...prevUser,
          sessionActive: true,
        }));
        setDialogs(res.data); // Здесь используем результат первого вызова
        setParticipants([]);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to activate session or get dialogs");
      })
      .finally(() => {
        setLoadingDialogs(false);
      });
  };

  const handleDialogClick = (id: number, phone: string) => {
    setSelectedDialogId(id);
    setShowFindForm(false);

    todoService
      .getDialogueInfo(id, phone)
      .then((res) => {
        const { participants, title, joinDate } = res.data;
        setDialogParticipantsCount(participants);
        setDialogTitle(title);
        setJoinDate(joinDate);
        setShowFindForm(true);
        setParticipants([]);
        setCommonChats([]);
      })
      .catch((err) => {
        console.error("Failed to get dialogue info:", err);
        toast.error("Failed to get dialogue info");
      });
  };

  const todoList = () =>
    todos.map((profile) => (
      <TodoComponent
        key={profile._id}
        profile={profile}
        userId={user._id}
        setTodos={setTodos}
        onUserClick={() => {
          handleUserClick(profile.phone, profile._id);
        }}
        isSelected={selectedProfileId === profile._id}
      />
    ));

  const handleFindUsers = (
    phone: string,
    dialogId: number,
    firstName: string,
    lastName: string,
    count: number,
    isPremium: boolean
  ): Promise<void> => {
    return todoService
      .findUsers(
        user.username,
        phone,
        dialogId,
        count,
        firstName,
        lastName,
        isPremium
      )
      .then((res) => {
        const { participants, commonChats } = res.data;
        setParticipants(participants);
        setCommonChats(commonChats);
        setShowParticipants(true);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Ошибка поиска участников");
      });
  };

  const handleSendMessage = (
    phone: string,
    dialogId: number,
    message: string
  ): Promise<void> => {
    setShowParticipants(false);
    return todoService
      .sendMessage(user.username, phone, dialogId, message, participants)
      .then((res) => {
        setDialogParticipantsCount((prev) => prev + participants.length);
        setParticipants([]);
        setCommonChats([]);
        toast.success("Успешная рассылка сообщений");
      })
      .catch((err) => {
        console.error(err);
        //toast.error("Ошибка отправки сообщения");
      });
  };

  const formatDate = (unixTime: number): string => {
    const date = new Date(unixTime * 1000); // Преобразование из секунд в миллисекунды
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Месяцы начинаются с 0
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleRemoveParticipant = (id: string, username: string) => {
    setParticipants((prevParticipants) =>
      prevParticipants.filter((participant) => participant.id !== id)
    );
    todoService.removeParticipant(user.username, username);
  };

  const handleExpandParticipant = (id: string) => {
    setExpandedParticipant(expandedParticipant === id ? null : id);
  };

  const getUserStatus = (status: string | null) => {
    const statusMap: { [key: string]: string } = {
      UserStatusRecently: "Был(а) недавно",
      UserStatusLastWeek: "Был(а) на прошлой неделе",
      UserStatusLastMonth: "Был(а) в прошлом месяце",
      UserStatusOffline: "Offline",
      UserStatusOnline: "Online",
      UserStatusEmpty: "Empty",
    };

    // Если статус отсутствует или не найден в карте, вернется "Не известно"
    return statusMap[status ?? ""] || "Не известно";
  };
  const renderCommonChats = (userId: string) => {
    const userChats = commonChats.find((chat) => chat.userId === userId);
    if (!userChats || userChats.chats.length === 0) {
      return <div>Общие чаты не найдены.</div>;
    }

    return (
      <div className={s.dialogues}>
        {userChats.chats.map((chat) => {
          const imageUrl = `${API_BASE_URL}/static/channels/100${chat.id}.png`;

          return (
            <div className={`${s.dialogue}`} key={chat.id}>
              <img className={s.image} src={imageUrl} alt="Profile" />
              <div className={s.dialogueDetails}>
                <span className={s.dialogueTitle}>{chat.title}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={s.container}>
      {showAddingTodo ? (
        <AddingTodo
          userId={user._id} // Передайте userId в AddingTodo
          onClose={() => setShowAddingTodo(false)}
          onTodoAdded={handleTodoAdded} // Метод для закрытия формы
        />
      ) : (
        <>
          <div className={s.profilesTable}>
            {loadingTodos ? (
              <Spinner />
            ) : (
              <>
                <div className={s.profilesHeader}>
                  <button
                    className={s.btn}
                    onClick={() => setShowAddingTodo(true)} // Показываем форму добавления
                  >
                    <PersonPlusFill size={30} color="#666" />
                  </button>
                  <div className={s.profileLogin}>{user.username}</div>
                </div>
                <Table todoLength={todos.length} todoList={todoList} />
              </>
            )}
          </div>
          <div className={s.dialoguesWrapper}>
            {selectedProfileId ? (
              <>
                <div className={s.dialoguesHeader}>ДИАЛОГИ</div>
                <div className={s.filterWrapper}>
                  <input
                    type="text"
                    placeholder="Фильтр по названию"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className={s.filterInput}
                  />
                </div>
              </>
            ) : null}

            <div className={s.dialogues}>
              {loadingDialogs ? (
                <Spinner />
              ) : (
                filteredDialogues.map((dialog) => {
                  const formattedChannel = dialog.id.replace(/-/g, "");
                  const imageUrl = `${API_BASE_URL}/static/channels/${formattedChannel}.png`;
                  const phone =
                    todos.find((profile) => profile._id === selectedProfileId)
                      ?.phone || "";

                  return (
                    <div
                      className={`${s.dialogue} ${
                        selectedDialogId === dialog.id ? s.selected : ""
                      }`}
                      key={dialog.id}
                      onClick={() => {
                        if (dialog.visible) {
                          handleDialogClick(dialog.id, phone);
                        } else {
                          toast.error("Список участников в этом канале скрыт");
                        }
                      }}
                    >
                      <img className={s.image} src={imageUrl} alt="Profile" />
                      <div className={s.dialogueDetails}>
                        <span className={s.dialogueTitle}>{dialog.title}</span>
                        <span className={s.dialogueParticipants}>
                          Участников: {dialog.participants}
                          {dialog.visible ? (
                            ""
                          ) : (
                            <span className={s.hiddenParticipants}>
                              {" "}
                              (профили скрыты)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedDialogId && (
            <div className={s.messageSenderWrapper}>
              <div className={s.dialogDetailsContainer}>
                <div className={s.senderHeader}>ОТПРАВКА СООБЩЕНИЙ</div>
                <div className={s.dialogDetails}>
                  <p>
                    <strong>Канал:</strong>{" "}
                    {dialogTitle !== null ? dialogTitle : "Загрузка..."}
                  </p>
                  <p>
                    <strong>Дата вступления:</strong>{" "}
                    {joinDate !== null ? formatDate(joinDate) : "Загрузка..."}
                  </p>
                  <p>
                    <strong>Успешных рассылок сообщений:</strong>{" "}
                    {dialogParticipantsCount !== null
                      ? dialogParticipantsCount
                      : "Загрузка..."}
                  </p>
                </div>
                {showFindForm && selectedProfileId && selectedDialogId && (
                  <FindForm
                    dialogId={selectedDialogId}
                    phone={
                      todos.find((profile) => profile._id === selectedProfileId)
                        ?.phone || ""
                    }
                    onSend={handleFindUsers}
                    onClose={() => setShowFindForm(false)}
                  />
                )}

                {participants && participants.length > 0 && (
                  <>
                    {showParticipants && (
                      <div className={s.participantsTable}>
                        {participants.map((participant) => (
                          <div
                            key={participant.id}
                            className={`${s.participantContainer} ${
                              expandedParticipant === participant.id
                                ? s.expanded
                                : ""
                            }`}
                            onClick={() => {
                              handleExpandParticipant(participant.id);
                            }}
                          >
                            <img
                              src={`${API_BASE_URL}/static/participants/${participant.username}.png`}
                              alt="Profile"
                              className={`${s.image} ${
                                expandedParticipant === participant.id
                                  ? s.imageExpanded
                                  : ""
                              }`}
                            />
                            {expandedParticipant != participant.id && (
                              <div className={s.participantDetails}>
                                <span className={s.dialogueTitle}>
                                  {participant.firstName} {participant.lastName}
                                </span>
                                <span className={s.dialogueParticipants}>
                                  @{participant.username}
                                </span>
                                <span className={s.dialogueParticipants}>
                                  Статус:{" "}
                                  {participant?.status?.className
                                    ? getUserStatus(
                                        participant.status.className
                                      )
                                    : "Не известно"}{" "}
                                  | Телефон:{" "}
                                  {participant?.phone
                                    ? participant.phone
                                    : "Скрыт"}
                                </span>
                              </div>
                            )}
                            <div className={s.removeButton}>
                              <button
                                className={s.removeButton}
                                onClick={() =>
                                  handleRemoveParticipant(
                                    participant.id,
                                    participant.username
                                  )
                                }
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <MessageForm
                      dialogId={selectedDialogId}
                      phone={
                        todos.find(
                          (profile) => profile._id === selectedProfileId
                        )?.phone || ""
                      }
                      onSend={handleSendMessage}
                      onClose={() => setShowFindForm(false)}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          <div className={s.commonChatsWrapper}>
            {expandedParticipant != null && (
              <>
                <div className={s.senderHeader}>ОБЩИЕ ЧАТЫ</div>
                <div className={s.commonChats}>
                  {renderCommonChats(expandedParticipant)}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={true}
        newestOnTop={true}
        rtl={false}
        theme="dark"
      />
    </div>
  );
};

interface TodoListProps {
  user: User;
  setLoginUser: React.Dispatch<React.SetStateAction<User>>;
}

export default TodoList;
