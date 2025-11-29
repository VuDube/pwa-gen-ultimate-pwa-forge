import { IndexedEntity, Env } from "./core-utils";
import type { User, Chat, ChatMessage, JobState, AnalysisResult, GeneratedFiles, ValidationResult } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS } from "@shared/mock-data";
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map((c) => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter((m) => m.chatId === c.id)
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate((s) => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}
export class JobEntity extends IndexedEntity<JobState> {
  static readonly entityName = "job";
  static readonly indexName = "jobs";
  static readonly initialState: JobState = {
    id: "",
    input: "",
    inputType: "zip",
    status: "pending",
    createdAt: 0,
    generated: undefined,
    validation: undefined,
  };
  static async createJob(env: Env, data: { input: string | { name: string; }; inputType: 'zip' | 'github'; }): Promise<JobState> {
    const jobState: JobState = {
      id: crypto.randomUUID(),
      ...data,
      status: 'pending',
      createdAt: Date.now()
    };
    await this.create(env, jobState);
    return jobState;
  }
  async updateStatus(
    newStatus: JobState['status'],
    analysis?: AnalysisResult,
    generated?: GeneratedFiles,
    error?: string,
    validation?: ValidationResult
  ): Promise<JobState> {
    return this.mutate((s) => ({
      ...s,
      status: newStatus,
      ...(analysis && { analysis }),
      ...(generated && { generated }),
      ...(error && { error }),
      ...(validation && { validation })
    }));
  }
}