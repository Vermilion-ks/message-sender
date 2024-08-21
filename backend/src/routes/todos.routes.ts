import express, { Request, Response } from "express";
import DialogModel from "../models/dialog.model";
import TodoModel from "../models/todo.model";
import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { FloodWaitError } from "telegram/errors";
import bigInt from "big-integer";
import { promises as fs } from "fs";
import * as path from "path";

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

todoRoutes
  .route("/send-code")
  .post(async (request: Request, response: Response) => {
    const { phone } = request.body;

    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
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

    console.log("[INFO] Route /activate-session/:phone called");

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

    // Сохранение изменений
    await user.save();
    const stringSession = new StringSession(user.session);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();
    const profile = await client.getMe();
    const userId = profile.id;

    try {
      const dialogs = await client.getDialogs();
      const channelDialogs = dialogs.filter((dialog: any) => dialog.isChannel);

      for (const dialog of channelDialogs) {
        const entity = dialog.entity as any; // Приводим к типу any для простоты

        if (entity && entity.photo) {
          const cleanId = String(dialog.id).replace(/-/g, "");
          const filePath = `../client/src/channels/${cleanId}.png`;

          try {
            await fs.access(filePath);
          } catch (err) {
            const buffer = await client.downloadProfilePhoto(dialog as any);
            if (buffer) {
              await fs.writeFile(filePath, buffer);
            }
          }
        }
      }

      const filteredDialogs = channelDialogs.filter(
        (dialog: any) =>
          dialog.title !== "JIO Financial Services ЧАТ NICK" &&
          dialog.title !== "JIO Financial Services | Channel"
      );

      const simplifiedDialogs = filteredDialogs.map((dialog: any) => ({
        id: dialog.id,
        title: dialog.title,
        isChannel: dialog.isChannel,
        isGroup: dialog.isGroup,
        isUser: dialog.isUser,
        participants: dialog.entity?.participantsCount ?? 0,
      }));

      response.json(simplifiedDialogs);
    } catch (error) {
      console.error("[ERROR] Failed to get dialogs:", error);
      response.status(500).json({ error: "Failed to get dialogs" });
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
      connectionRetries: 5,
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
  const { phone, dialogId, count } = req.body;

  const user = await TodoModel.findOne({ phone });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const stringSession = new StringSession(user.session);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
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

    const maxPhotoId = BigInt("2000000000000000000");

    // Отфильтровываем участников, у которых есть фото профиля
    const participantsWithPhoto = nonAdminParticipants.filter(
      (participant: any) =>
        participant.photo &&
        participant.username &&
        participant.photo.photoId &&
        BigInt(participant.photo.photoId.value) <= maxPhotoId
    );

    // Текущая дата и время
    const now = new Date();

    // Получаем Unix-время в секундах
    const unixTime = Math.floor(now.getTime() / 1000);

    const participantsLastOnline = participantsWithPhoto.filter(
      (participant: any) => participant.status
    );
    // Отфильтровываем участников, которым уже было отправлено сообщение
    const participantsToSend = participantsLastOnline.filter(
      (participant: any) => !dialog?.participants.includes(participant.username) // Используем опциональную цепочку
    );

    if (participantsToSend.length < count) {
      return res.status(400).json({
        error: "Not enough non-admin participants with photos in the group",
      });
    }

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const randomParticipants = participantsToSend
      .sort(() => 0.5 - Math.random()) // Перемешивание массива случайным образом
      .slice(0, count); // Выбор нужного количества участников

    for (const participant of randomParticipants) {
      const entity = participant as any; // Приводим к типу any для простоты

      if (entity && entity.photo) {
        const filePath = `../client/src/participants/${entity.username}.png`;

        try {
          await fs.access(filePath);
        } catch (err) {
          const buffer = await client.downloadProfilePhoto(entity as any);
          if (buffer) {
            await fs.writeFile(filePath, buffer);
          }
        }
      }
    }
    return res.status(200).json({ participants: randomParticipants });
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
      connectionRetries: 5,
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
      // console.log(participant.username);
      // console.log(participant.id);
      // console.log(sleepTime);
      // Отправка сообщения
      //await client.sendMessage(participant.username, { message });
      //await client.sendMessage("vermilion_ks", { message });
      // Добавляем участника в список участников, которым было отправлено сообщение
      //dialog.participants.push(participant.username);
      // Задержка в 1 секунду
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
      connectionRetries: 5,
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

      // Скачивание первой фотографии профиля
      const buffer = await client.downloadProfilePhoto(user);

      if (buffer) {
        const filePath = `../client/src/pictures/${user.phone}.jpg`;
        await fs.writeFile(filePath, buffer);
      } else {
        console.log("Failed to download profile photo");
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
