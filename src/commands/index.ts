import { firestore } from "../firebase";
import { Item } from '../editor'

type State = any;
type GetState = () => State;

export interface Command {
  invoke(): Promise<void>;
  undo(args?: any): Promise<void>;
  redo(): Promise<void>;
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

  async invoke() {
    return updateStoreItem(this.item.id, this.content);
  }
  async undo({ id, before }: any) {
    return updateStoreItem(id, before);
  }
  async redo() {
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

  async invoke() {
    this.before = this.item
    deleteStoreItem(this.item.id);
  }
  async undo({ id, before }: any){
    updateStoreItem(id, before);
  }
  async redo() {
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

  async invoke() {
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

export const undoCommands: Record<string, Command> = {
  'createItem': new createItem(),
  'deleteItem': new deleteItem({} as any),
  'updateItem': new updateItem({} as any, {})
}
