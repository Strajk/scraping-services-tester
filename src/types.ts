/* eslint-disable no-unused-vars */
export interface Service {
  name: string
  link?: string
  dashboardLink?: string
  note?: string
  settings?: object // optional, but majority of services should have it
  fn: any,
  tokenLength?: number
  tokenRegex?: RegExp
  tokenHint?: string
  tokenPlaceholder?: string
}

export interface Services {
  [key: string]: Service
}

export interface Setting {
  type: "boolean" | "text" | "select" // TODO: maybe number?
  label: string
  note?: string
  default: any
  options?: string[]
}

export interface Settings {
  [key: string]: Setting
}

export type ResultCore = {
  key: string;
  service: string;
  timestamp: string;
}

export type ResultError = ResultCore & {
  error: string; // only on fetch failure, not return by the service
}

export type ResultUpdate = {
  duration: number;
  status: number;
  statusText: string;
  contentLength: number | undefined;
  headers: Record<string, string>;
  text: string | undefined;
  data: any;
}

export type ResultWhole = ResultCore & ResultUpdate

export const isResultWhole = (x: ResultCore): x is ResultWhole => {
  return "duration" in x
}

export const isResultError = (x: ResultCore): x is ResultError => {
  return "error" in x
}

export enum ActionType {
  Push = "push",
  Update = "update",
  Clear = "clear",
}

export type Action =
  | { type: ActionType.Push, payload: ResultCore }
  | { type: ActionType.Update, payload: ResultError | ResultWhole }
  | { type: ActionType.Clear, payload?: { service: string } }

export type FormTokensValues = {
  [key: string]: string; // TODO: keyof services
}

export type FormTogglesValues = {
  [key: string]: boolean; // TODO: keyof services
}

export type FormConfigValues = {
  url: string;
}

export type FormSettingsValues = {
  [key: string]: boolean; // TODO: keyof services
}
