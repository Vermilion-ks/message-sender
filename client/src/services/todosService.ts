import axios, { AxiosResponse } from "axios";
import { Profile } from "../models/Profile";
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
const TODOS_API_BASE_URL = "http://localhost:8081/messagesender/";

class TodosService {
  async getTodosByUserId(userId: string): Promise<AxiosResponse<Profile[]>> {
    return await axios.get(`${TODOS_API_BASE_URL}user/${userId}`);
  }

  async getTodoById(objectId: string): Promise<AxiosResponse<Profile>> {
    return await axios.get(`${TODOS_API_BASE_URL}${objectId}`);
  }

  async addProfile(todo: Profile): Promise<AxiosResponse<Profile>> {
    return await axios.post(`${TODOS_API_BASE_URL}add`, {
      userId: todo.userId,
      phone: todo.phone,
    });
  }

  async updateTodo(
    todo: Profile,
    objectId: string
  ): Promise<AxiosResponse<Profile>> {
    return await axios.post(`${TODOS_API_BASE_URL}update/${objectId}`, {
      userId: todo.userId,
      phone: todo.phone,
    });
  }

  async deleteTodoById(objectId: string): Promise<AxiosResponse<Profile>> {
    return await axios.delete(`${TODOS_API_BASE_URL}${objectId}`);
  }

  async sendCode(phone: string): Promise<AxiosResponse<any>> {
    return await axios.post(`${TODOS_API_BASE_URL}send-code`, {
      phone,
    });
  }

  async validateCode(
    phone: string,
    code: string,
    password: string
  ): Promise<AxiosResponse<any>> {
    return await axios.post(`${TODOS_API_BASE_URL}validate-code`, {
      phone,
      code,
      password,
    });
  }

  async activateSession(phone: string): Promise<AxiosResponse<any>> {
    return await axios.post(`${TODOS_API_BASE_URL}activate-session/${phone}`);
  }

  async getDialogueInfo(
    id: number,
    phone: string
  ): Promise<AxiosResponse<any>> {
    return axios.post(`${TODOS_API_BASE_URL}dialog-info/`, {
      id,
      phone,
    });
  }

  async getDialogs(phone: string): Promise<AxiosResponse<any>> {
    return await axios.post(`${TODOS_API_BASE_URL}dialogs/${phone}`);
  }

  async findUsers(phone: string, dialogId: number, count: number) {
    return axios.post(`${TODOS_API_BASE_URL}find-users/`, {
      phone,
      dialogId,
      count,
    });
  }

  async sendMessage(
    phone: string,
    dialogId: number,
    message: string,
    participans: Participant[]
  ) {
    return axios.post(`${TODOS_API_BASE_URL}send-message/`, {
      phone,
      dialogId,
      message,
      participans,
    });
  }
}

export default new TodosService();
