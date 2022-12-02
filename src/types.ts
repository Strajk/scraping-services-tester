export interface Service {
  name: string
  link?: string
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
  return 'duration' in x
}

export const isResultError = (x: ResultCore): x is ResultError => {
  return 'error' in x
}

export enum ActionType {
  Push = 'push',
  Update = 'update',
  Clear = 'clear',
}

// TODO: better typing based on ActionType
export interface Action {
  type: ActionType;
  payload?: ResultCore
    | ResultUpdate
    | ResultError
    | ResultWhole
    | { service: string };
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
