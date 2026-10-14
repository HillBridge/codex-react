import { demoUsers, type DemoUser } from "./demo-data";

const sessions = new Map<string, DemoUser>();

export function findUser(username: string, password: string) {
  return demoUsers.find((user) => user.username === username && user.password === password);
}

export function saveSession(id: string, user: DemoUser) {
  sessions.set(id, user);
}

export function getSession(id: string | undefined) {
  return id ? sessions.get(id) : undefined;
}

export function deleteSession(id: string | undefined) {
  if (id) sessions.delete(id);
}

export function resetDemoStore() {
  sessions.clear();
}
