export const APP_NAME = "LCDS";

export const APP_TITLE_FA = "سیستم مدیریت دانش سازمان";

export const APP_DESCRIPTION =
  "سیستم مدیریت دانش سازمان با تمرکز بر محتوا و خوانایی";

export type UserRole = "admin" | "user";

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
};

export const AUTH_COOKIE_NAME = "lcds.session";
export const AUTH_USER_STORAGE_KEY = "lcds.auth.user";
export const AUTH_TOKEN_STORAGE_KEY = "lcds.auth.token";

export const ASSISTANT_PATH = "/assistant";
export const ASSISTANT_STORAGE_KEY = "lcds.assistant.v1";
