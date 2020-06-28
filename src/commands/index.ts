import { firestore } from "../firebase";
import { Item } from '../editor'

export interface Command<T = any> {
  name: string
  invoke(...args: any): Promise<T>;
  undo(payload: T): Promise<void>;
  redo(): Promise<void>;
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

type UpdateItemPayload = {
  id: string,
  before: Item
}
export class updateItem implements Command<UpdateItemPayload> {
  name = 'updateItem'

  async invoke(item: Item, content: Partial<Item>) {
    updateStoreItem(item.id, content);
    return { id: item.id, before: item }
  }
  async undo({ id, before }: UpdateItemPayload) {
    updateStoreItem(id, before);
  }
  async redo() {
    throw new Error("Method not implemented.");
  }
}

type DeleteItemPayload = {
  id: string
  before: Item
}

export class deleteItem implements Command<DeleteItemPayload> {
  name = 'deleteItem'

  async invoke(item: Item) {
    deleteStoreItem(item.id);
    return {
      id: item.id, before: item
    }
  }
  async undo({ id, before }: DeleteItemPayload){
    updateStoreItem(id, before);
  }
  async redo() {
    throw new Error("Method not implemented.");
  }
}

export class createItem implements Command<string> {
  name = 'createItem'

  async invoke() {
    const itemId = String(Number(new Date()));
    const item = {
      id: itemId,
      type: "text",
      label: "title",
      placeholder: "",
    };

    updateStoreItem(itemId, item);
    return itemId
  }
  async undo(payload: string) {
    deleteStoreItem(payload);
  }
  async redo() {
    throw new Error("Method not implemented.");
  }
}

export const undoCommands: Record<string, Command> = {
  'createItem': new createItem(),
  'deleteItem': new deleteItem(),
  'updateItem': new updateItem()
}
