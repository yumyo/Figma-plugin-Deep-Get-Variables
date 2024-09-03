import { EventHandler } from '@create-figma-plugin/utilities';

export interface VariableUpdateHandler extends EventHandler {
  name: 'VARIABLE_UPDATE';
  handle: (value: any) => void;
}

export interface MyCustomHandler extends EventHandler {
  name: 'MY_CUSTOM_EVENT';
  handle: (data: any) => void;
}

export type CloseHandler = {
  name: 'CLOSE'
  handler: () => void
}

export interface CreateRectanglesHandler {
  type: 'CREATE_RECTANGLES'
  count: number
}

export interface VariableInfo {
  name: string
  type: string
  nodeName: string
}