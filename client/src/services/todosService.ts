import axios, { AxiosResponse } from "axios";
import { Profile } from "../models/Profile";
import { API_BASE_URL } from "./consts";
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
const TODOS_API_BASE_URL = API_BASE_URL;

class TodosService {
  async getTodosByUserId(userId: string): Promise<AxiosResponse<Profile[]>> {
    return await axios.get(`${TODOS_API_BASE_URL}/profiles/user/${userId}`);
  }

  async getTodoById(objectId: string): Promise<AxiosResponse<Profile>> {
    return await axios.get(`${TODOS_API_BASE_URL}/profiles/${objectId}`);
  }

  async addProfile(todo: Profile): Promise<AxiosResponse<Profile>> {
    return await axios.post(`${TODOS_API_BASE_URL}/profiles/add`, {
      userId: todo.userId,
      phone: todo.phone,
    });
  }

  async updateTodo(
    todo: Profile,
    objectId: string
  ): Promise<AxiosResponse<Profile>> {
    return await axios.post(
      `${TODOS_API_BASE_URL}/profiles/update/${objectId}`,
      {
        userId: todo.userId,
        phone: todo.phone,
      }
    );
  }

  async deleteTodoById(objectId: string): Promise<AxiosResponse<Profile>> {
    return await axios.delete(`${TODOS_API_BASE_URL}/profiles/${objectId}`);
  }

  async sendCode(phone: string): Promise<AxiosResponse<any>> {
    return await axios.post(`${TODOS_API_BASE_URL}/profiles/send-code`, {
      phone,
    });
  }

  async validateCode(
    phone: string,
    code: string,
    password: string
  ): Promise<AxiosResponse<any>> {
    return await axios.post(`${TODOS_API_BASE_URL}/profiles/validate-code`, {
      phone,
      code,
      password,
    });
  }

  async activateSession(phone: string): Promise<AxiosResponse<any>> {
    return await axios.post(
      `${TODOS_API_BASE_URL}/profiles/activate-session/${phone}`
    );
  }

  async getDialogueInfo(
    id: number,
    phone: string
  ): Promise<AxiosResponse<any>> {
    return axios.post(`${TODOS_API_BASE_URL}/profiles/dialog-info/`, {
      id,
      phone,
    });
  }

  async getDialogs(phone: string): Promise<AxiosResponse<any>> {
    return await axios.post(`${TODOS_API_BASE_URL}/profiles/dialogs/${phone}`);
  }

  async findUsers(
    mainLogin: string,
    phone: string,
    dialogId: number,
    count: number,
    firstName?: string,
    lastName?: string,
    isPremium?: boolean
  ) {
    return axios.post(`${TODOS_API_BASE_URL}/profiles/find-users/`, {
      mainLogin,
      phone,
      dialogId,
      count,
      firstName,
      lastName,
      isPremium,
    });
  }

  async removeParticipant(mainLogin: string, username: string) {
    return axios.post(`${TODOS_API_BASE_URL}/profiles/remove-participant/`, {
      mainLogin,
      username,
    });
  }

  async sendMessage(
    username: string,
    phone: string,
    dialogId: number,
    message: string,
    participans: Participant[],
    sleepTime: number
  ) {
    return axios.post(`${TODOS_API_BASE_URL}/profiles/send-message/`, {
      username,
      phone,
      dialogId,
      message,
      participans,
      sleepTime,
    });
  }
}

export default new TodosService();
