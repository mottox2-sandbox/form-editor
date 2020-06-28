import { firestore } from "../firebase";
import { Item } from '../editor'

type State = any;
type GetState = () => State;

export interface Command {
  invoke(getState: GetState): Promise<void>;
  undo(args?: any): Promise<void>;
  redo(getState: GetState): Promise<void>;
  record(): any
}

const updateStoreItem = (itemId: string, item: any) => {
  return firestore
    .collection("forms/6aB798wMx3sP02ZK26C9/items")
    .doc(itemId)
    .set(item, {
      merge: true,
    });
};

const deleteStoreItem = (itemId: string) => {
  return firestore
    .collection("forms/6aB798wMx3sP02ZK26C9/items")
    .doc(itemId)
    .delete();
};

export class updateItem implements Command {
  before: any;
  constructor(public item: Item, public content: any) {}

  async invoke(getState: GetState) {
    return updateStoreItem(this.item.id, this.content);
  }
  async undo({ id, before }: any) {
    return updateStoreItem(id, before);
  }
  async redo(getState: GetState) {
    throw new Error("Method not implemented.");
  }
  record() {
    return {
      name: 'updateItem',
      payload: {
        id: this.item.id,
        before: this.item,
      }
    }
  }
}

export class deleteItem implements Command {
  before: any;

  constructor(public item: Item) {}

  async invoke(getState: GetState) {
    this.before = this.item
    deleteStoreItem(this.item.id);
  }
  async undo({ id, before }: any){
    updateStoreItem(id, before);
  }
  async redo(getState: GetState) {
    throw new Error("Method not implemented.");
  }
  record() {
    return {
      name: 'deleteItem',
      payload: {
        id: this.item.id,
        before: this.before,
      }
    }
  }
}

export class createItem implements Command {
  itemId: string;

  constructor() {
    this.itemId = String(Number(new Date()));
  }

  async invoke(getState: GetState) {
    const item = {
      id: this.itemId,
      type: "text",
      label: "title",
      placeholder: "",
    };

    updateStoreItem(this.itemId, item);
  }
  async undo(payload: any) {
    deleteStoreItem(payload);
  }
  async redo() {
    throw new Error("Method not implemented.");
  }
  record() {
    return {
      name: 'createItem',
      payload: this.itemId
    }
  }
}

export class CommandManager {
  undoStack: Command[];
  redoStack: Command[];
  getState: GetState;

  constructor(getState: GetState) {
    this.undoStack = [];
    this.redoStack = [];
    this.getState = getState;
  }

  async invoke(command: Command) {
    await command.invoke(this.getState)
    this.undoStack.push(command);
    this.redoStack.length = 0;
    console.log(this);
  }

  async undo() {
    if (this.undoStack.length === 0) return;
    const command = this.undoStack.pop()!;
    await command.undo()
    this.redoStack.push(command);
  }
}

export const undoCommands: Record<string, Command> = {
  'createItem': new createItem(),
  'deleteItem': new deleteItem({} as any),
  'updateItem': new updateItem({} as any, {})
}
