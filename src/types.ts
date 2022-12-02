export interface Service {
  name: string
  desc: string
  fn: any,
  tokenLength?: number
  tokenRegex?: RegExp
  tokenHint?: string
  tokenPlaceholder?: string
}

export interface Services {
  [key: string]: Service
}

export type Result = {
  service: string;
  key: string;
  timestamp: string;
  duration: number;
  status: number;
  statusText: string;
  contentLength: number | undefined;
  headers: Record<string, string>;
  text: string | undefined;
  data: any;
}


export enum ActionType {
  Push = 'push',
  Clear = 'clear',
}

export interface Action {
  type: ActionType;
  payload?: Result | { service: string }; // TODO: better typing based on ActionType
}

export type FormTokensValues = {
  [key: string]: string; // TODO: keyof services
}

export type FormTogglesValues = {
  [key: string]: boolean; // TODO: keyof services
}

export type FormConfigValues = {
  url: string;
}
