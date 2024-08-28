import express, { Request, Response } from "express";
import DialogModel from "../models/dialog.model";
import TodoModel from "../models/todo.model";
import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { FloodWaitError } from "telegram/errors";
import bigInt from "big-integer";
import { promises as fs } from "fs";
import path from "path";

interface SessionInfo {
  session: string;
  firstName: string;
  lastName: string;
}

interface Photo {
  photoId: { value: bigint };
  // Другие свойства фото
}

interface Entity {
  photo?: Photo;
  // Другие общие свойства
}

interface Channel extends Entity {
  entity: any;
  // Специфические свойства Channel
}

const todoRoutes = express.Router();
let sessionString = process.env.TG_SESSION_STRING || "";

const apiId = parseInt(process.env.TG_API_ID || "29863266");
const apiHash = process.env.TG_API_HASH || "bdde13e3fdf54602a48147068dcec5ac";

// Хранилище для временного хранения сессий по номеру телефона
const sessions: { [key: string]: SessionInfo } = {};

const saveFile = async (filePath: string, buffer: Buffer) => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  } catch (err) {
    console.error(`Failed to save file: ${err}`);
  }
};

const getChannelDialogs = async (client: TelegramClient) => {
  try {
    const dialogs = await client.getDialogs();
    return dialogs.filter((dialog: any) => dialog.isChannel);
  } catch (error) {
    console.error("[ERROR] Failed to get dialogs:", error);
    throw new Error("Failed to get dialogs");
  }
};

const downloadAndSavePhoto = async (client: TelegramClient, dialog: any) => {
  if (dialog.entity && dialog.entity.photo) {
    const cleanId = String(dialog.id).replace(/-/g, "");
    const filePath = path.resolve(
      __dirname,
      "../images/channels/",
      `${cleanId}.png`
    );

    try {
      const buffer = await client.downloadProfilePhoto(dialog as any);
      if (buffer instanceof Buffer) {
        await saveFile(filePath, buffer);
      } else {
        console.error(
          `Failed to download photo: returned value is not a Buffer`
        );
      }
    } catch (err) {
      console.error(`Failed to download or save photo: ${err}`);
    }
  }
};

todoRoutes
  .route("/send-code")
  .post(async (request: Request, response: Response) => {
    const { phone } = request.body;

    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      useIPV6: false, // Если нужно использовать IPv6
      timeout: 60, // Таймаут в секундах, если нужен
      requestRetries: 5, // Количество попыток повторного запроса
      connectionRetries: 5, // Количество попыток повторного подключения
      retryDelay: 1000, // Задержка между попытками переподключения в миллисекундах
      autoReconnect: true, // Автоматическое переподключение
      maxConcurrentDownloads: 5, // Максимальное количество одновременных загрузок
      securityChecks: true, // Проверка на подделку сообщений
      appVersion: "1.0", // Версия приложения
      langCode: "en", // Код языка
      systemLangCode: "en", // Системный код языка
      useWSS: false, // Использовать WSS (или порт 443)
    });

    await client.connect();

    try {
      const result = await client.invoke(
        new Api.auth.SendCode({
          phoneNumber: phone,
          apiId: apiId,
          apiHash: apiHash,
          settings: new Api.CodeSettings({
            allowFlashcall: true,
            currentNumber: true,
            allowAppHash: true,
            allowMissedCall: true,
          }),
        })
      );

      // Сохранение состояния сессии
      sessions[phone] = {
        session: stringSession.save(),
        firstName: "",
        lastName: "",
      };

      response.status(200).json({ message: "Code sent successfully", result });
    } catch (error) {
      if (error instanceof FloodWaitError) {
        const waitTime = error.seconds;
        console.error(
          `Flood wait error: Please wait ${waitTime} seconds before retrying.`
        );
        response.status(429).json({
          error: `Flood wait error: Please wait ${waitTime} seconds before retrying.`,
        });
      } else {
        console.error(error);
        response.status(400).json({ error: "Failed to send code" });
      }
    }
  });

todoRoutes
  .route("/activate-session/:phone")
  .post(async (request: Request, response: Response) => {
    const { phone } = request.params;

    // Поиск пользователя в базе данных
    const user = await TodoModel.findOne({ phone: phone });
    if (!user) {
      console.log("[INFO] User not found");
      return response.status(404).json({ error: "User not found" });
    }

    // Отключение предыдущих сессий
    if (user.sessionActive) {
      user.sessionActive = false;
      await user.save();
    }

    // Установка сессии активной
    user.sessionActive = true;
    await user.save();

    const stringSession = new StringSession(user.session);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      useIPV6: false,
      timeout: 60,
      requestRetries: 5,
      connectionRetries: 5,
      retryDelay: 1000,
      autoReconnect: true,
      maxConcurrentDownloads: 5,
      securityChecks: true,
      appVersion: "1.0",
      langCode: "en",
      systemLangCode: "en",
      useWSS: false,
    });

    try {
      await client.connect();
      const channelDialogs = await getChannelDialogs(client);

      // Скачивание и сохранение фотографий
      await Promise.all(
        channelDialogs.map((dialog) => downloadAndSavePhoto(client, dialog))
      );

      const simplifiedDialogs = await Promise.all(
        channelDialogs.map(async (dialog: any) => ({
          id: dialog.id,
          title: dialog.title,
          isChannel: dialog.isChannel,
          isGroup: dialog.isGroup,
          isUser: dialog.isUser,
          participants: dialog.entity?.participantsCount ?? 0,
        }))
      );

      response.json(simplifiedDialogs);
    } catch (error) {
      console.error("[ERROR] Failed to process request:", error);
      response.status(500).json({ error: "Failed to process request" });
    } finally {
      await client.disconnect();
    }
  });

todoRoutes.route("/dialog-info").post(async (req: Request, res: Response) => {
  const { id, phone } = req.body;

  try {
    const user = await TodoModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const stringSession = new StringSession(user.session);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      useIPV6: false, // Если нужно использовать IPv6
      timeout: 60, // Таймаут в секундах, если нужен
      requestRetries: 5, // Количество попыток повторного запроса
      connectionRetries: 5, // Количество попыток повторного подключения
      retryDelay: 1000, // Задержка между попытками переподключения в миллисекундах
      autoReconnect: true, // Автоматическое переподключение
      maxConcurrentDownloads: 5, // Максимальное количество одновременных загрузок
      securityChecks: true, // Проверка на подделку сообщений
      appVersion: "1.0", // Версия приложения
      langCode: "en", // Код языка
      systemLangCode: "en", // Системный код языка
      useWSS: false, // Использовать WSS (или порт 443)
    });
    await client.connect();
    const entity = await client.getEntity(id);

    // Приведение типов и проверка наличия свойства `title`
    let chatTitle = "";
    if ("title" in entity) {
      const chat = entity as { title: string };
      chatTitle = chat.title;
    }

    let joinDate = 0;
    if ("date" in entity) {
      const chat = entity as { date: number };
      joinDate = chat.date;
    }

    const dialog = await DialogModel.findOne({ dialogId: id });
    if (!dialog) {
      return res
        .status(200)
        .json({ participants: 0, title: chatTitle, joinDate: joinDate });
    }

    return res.status(200).json({
      participants: dialog.participants.length,
      title: chatTitle,
      joinDate: joinDate,
    });
  } catch (error) {
    console.error("Failed to get dialog:", error);
    res.status(500).json({ error: "Failed to get dialog" });
  }
});

todoRoutes.route("/find-users").post(async (req: Request, res: Response) => {
  const { phone, dialogId, count, name } = req.body;

  const user = await TodoModel.findOne({ phone });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const stringSession = new StringSession(user.session);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      useIPV6: false, // Если нужно использовать IPv6
      timeout: 60, // Таймаут в секундах, если нужен
      requestRetries: 5, // Количество попыток повторного запроса
      connectionRetries: 5, // Количество попыток повторного подключения
      retryDelay: 1000, // Задержка между попытками переподключения в миллисекундах
      autoReconnect: true, // Автоматическое переподключение
      maxConcurrentDownloads: 5, // Максимальное количество одновременных загрузок
      securityChecks: true, // Проверка на подделку сообщений
      appVersion: "1.0", // Версия приложения
      langCode: "en", // Код языка
      systemLangCode: "en", // Системный код языка
      useWSS: false, // Использовать WSS (или порт 443)
    });
    await client.connect();

    let dialog = await DialogModel.findOne({ dialogId });
    if (!dialog) {
      dialog = new DialogModel({
        dialogId,
        participants: [],
      });
      await dialog.save();
    }

    const chat = await client.getEntity(dialogId);
    const participants = await client.getParticipants(chat);

    // Отфильтровываем участников, которые не являются администраторами
    const nonAdminParticipants = participants.filter(
      (participant: any) =>
        !(participant.participant && "adminRights" in participant.participant)
    );

    // Отфильтровываем участников, у которых есть фото профиля
    const participantsWithPhoto = nonAdminParticipants.filter(
      (participant: any) =>
        participant.photo && participant.username && participant.photo.photoId
    );

    // Добавляем фильтрацию по имени, если name не пустое
    const filteredParticipants = name
      ? participantsWithPhoto.filter((participant: any) =>
          participant.firstName.toLowerCase().includes(name.toLowerCase())
        )
      : participantsWithPhoto;

    const participantsToSend = filteredParticipants.filter(
      (participant: any) => !dialog?.participants.includes(participant.username)
    );

    const randomParticipants = participantsToSend
      .sort(() => 0.5 - Math.random())
      .slice(0, count);

    // Инициализируем массив commonChats
    let commonChats: { userId: string; chats: any[] }[] = [];

    for (const participant of randomParticipants) {
      const entity = participant as any;

      if (entity && entity.photo) {
        const filePath = path.resolve(
          __dirname,
          "../images/participants/",
          entity.username + ".png"
        );

        try {
          // Получаем общие группы с пользователем
          const commonGroups = await client.invoke(
            new Api.messages.GetCommonChats({
              userId: entity.id,
              limit: 100, // Устанавливаем лимит на количество возвращаемых групп
            })
          );

          // Добавляем в массив commonChats
          commonChats.push({
            userId: String(entity.id),
            chats: commonGroups.chats,
          });

          // Загружаем фото профиля
          const buffer = await client.downloadProfilePhoto(entity as any);
          if (buffer instanceof Buffer) {
            await saveFile(filePath, buffer);
          } else {
            console.error(
              `Failed to download photo: returned value is not a Buffer`
            );
          }
        } catch (err) {
          console.error(
            `Failed to process participant ${entity.username}:`,
            err
          );
        }
      }
    }
    console.log(commonChats[0].chats);
    return res
      .status(200)
      .json({ participants: randomParticipants, commonChats: commonChats });
  } catch (error) {
    console.error("Failed to send message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

todoRoutes.route("/send-message").post(async (req: Request, res: Response) => {
  const { phone, dialogId, message, participans, sleepTime } = req.body;

  const user = await TodoModel.findOne({ phone });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const stringSession = new StringSession(user.session);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      useIPV6: false, // Если нужно использовать IPv6
      timeout: 60, // Таймаут в секундах, если нужен
      requestRetries: 5, // Количество попыток повторного запроса
      connectionRetries: 5, // Количество попыток повторного подключения
      retryDelay: 1000, // Задержка между попытками переподключения в миллисекундах
      autoReconnect: true, // Автоматическое переподключение
      maxConcurrentDownloads: 5, // Максимальное количество одновременных загрузок
      securityChecks: true, // Проверка на подделку сообщений
      appVersion: "1.0", // Версия приложения
      langCode: "en", // Код языка
      systemLangCode: "en", // Системный код языка
      useWSS: false, // Использовать WSS (или порт 443)
    });
    await client.connect();

    let dialog = await DialogModel.findOne({ dialogId });
    if (!dialog) {
      dialog = new DialogModel({
        dialogId,
        participants: [],
      });
      await dialog.save();
    }

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    for (const participant of participans) {
      await client.sendMessage(participant.username, { message });
      dialog.participants.push(participant.username);
      await sleep(sleepTime * 1000);
    }

    await dialog.save();

    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Failed to send message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

todoRoutes
  .route("/validate-code")
  .post(async (request: Request, response: Response) => {
    const { phone, code, password } = request.body;

    if (!sessions[phone]) {
      return response
        .status(400)
        .json({ error: "Session not found for this phone number" });
    }

    const stringSession = new StringSession(sessions[phone].session);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      useIPV6: false, // Если нужно использовать IPv6
      timeout: 60, // Таймаут в секундах, если нужен
      requestRetries: 5, // Количество попыток повторного запроса
      connectionRetries: 5, // Количество попыток повторного подключения
      retryDelay: 1000, // Задержка между попытками переподключения в миллисекундах
      autoReconnect: true, // Автоматическое переподключение
      maxConcurrentDownloads: 5, // Максимальное количество одновременных загрузок
      securityChecks: true, // Проверка на подделку сообщений
      appVersion: "1.0", // Версия приложения
      langCode: "en", // Код языка
      systemLangCode: "en", // Системный код языка
      useWSS: false, // Использовать WSS (или порт 443)
    });

    try {
      await client.start({
        phoneNumber: () => phone,
        phoneCode: () => code,
        password: password ? () => password : undefined,
        onError: (err: any) => console.error(err),
      });

      const user = await client.getMe();
      const userId = user.id;
      const userPhone = user.phone;
      const firstName = user.firstName ?? "";
      const lastName = user.lastName ?? "";

      sessions[phone] = {
        session: sessions[phone].session,
        firstName: firstName,
        lastName: lastName,
      };

      // Получение списка фотографий пользователя
      const photos = await client.invoke(
        new Api.photos.GetUserPhotos({
          userId: userId,
          offset: 0,
          maxId: bigInt(0),
          limit: 1,
        })
      );

      if (photos.photos.length === 0) {
        return response.status(404).json({ error: "No photos found" });
      }

      const filePath = path.resolve(
        __dirname,
        "../images/pictures/",
        user.phone + ".png"
      );
      try {
        const buffer = await client.downloadProfilePhoto(user);
        if (buffer instanceof Buffer) {
          await saveFile(filePath, buffer);
          console.log(`Image saved to ${filePath}`);
        } else {
          console.error(
            `Failed to download photo: returned value is not a Buffer`
          );
        }
      } catch (err) {
        console.error(`Failed to download or save photo: ${err}`);
      }

      response.status(200).json({
        message: "Code validated successfully",
        userId,
        userPhone,
        firstName,
      });
    } catch (error) {
      console.error("Error validating code:", error);
      response.status(400).json({ error: "Invalid code" });
    }
  });

todoRoutes.route("/add").post((request: Request, response: Response) => {
  const todo = new TodoModel(request.body);

  if (todo.phone) {
    todo.session = sessions[todo.phone].session;
    todo.firstName = sessions[todo.phone].firstName;
    todo.lastName = sessions[todo.phone].lastName;
  } else {
    console.error("Phone is not provided");
    return response.status(400).json({ error: "Phone is required" });
  }
  todo
    .save()
    .then(() => {
      response.status(200).json({ message: "Todo added successfully" });
    })
    .catch((err) => {
      console.error(`Adding new todo failed: ${err}`);
      response.status(400).send("Adding new todo failed");
    });
});

todoRoutes
  .route("/user/:userId")
  .get((request: Request, response: Response) => {
    TodoModel.find({ userId: request.params.userId }, (err: any, todos) => {
      if (err) {
        console.error(err);
        response.status(500).json(err);
      } else {
        response.json(todos);
      }
    });
  });

todoRoutes.route("/:id").get((request: Request, response: Response) => {
  const id = request.params.id;
  TodoModel.findById(id, (err: Error, todo: any) => {
    if (err || !todo) {
      response.status(404).send(`Todo not found!`);
    } else {
      response.json(todo);
    }
  });
});

todoRoutes.route("/update/:id").post((request: Request, response: Response) => {
  TodoModel.findById(request.params.id, (err: Error, todo: any) => {
    if (!todo) {
      response.status(404).send(`Todo not found!`);
    } else {
      todo.phone = request.body.phone;
      todo.password = request.body.password;
      todo
        .save()
        .then(() => {
          response.status(200).json({ message: "Todo updated successfully" });
        })
        .catch((err: Error) => {
          response.status(400).send(err.message);
        });
    }
  });
});

todoRoutes.route("/:id").delete((request: Request, response: Response) => {
  TodoModel.findByIdAndRemove(request.params.id)
    .then(() => {
      response.json("Todo deleted successfully");
    })
    .catch((err) => {
      console.error(`Removing todo failed: ${err}`);
      response.status(400).send("Error deleting todo");
    });
});

export default todoRoutes;
