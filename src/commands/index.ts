import firebase from 'firebase/app'
import 'firebase/firestore'

import { firestore } from "../firebase";
import { Item } from "../editor";

export interface Command<T = any> {
  name: string;
  invoke(...args: any): Promise<T>;
  undo(payload: T): Promise<void>;
  redo(payload: T): Promise<void>;
}

const formDoc = firestore.doc("forms/6aB798wMx3sP02ZK26C9");
const mergeOption = { merge: true };

const updateStoreItem = (itemId: string, item: any) => {
  return formDoc.collection("items").doc(itemId).set(item, mergeOption);
};

// indexを追加
const pushItemToForm = (itemId: string) => {
  return formDoc.update({
    itemIds: firebase.firestore.FieldValue.arrayUnion(itemId)
  })
}

const removeItemFromForm = (itemId: string) => {
  return formDoc.update({
    itemIds: firebase.firestore.FieldValue.arrayRemove(itemId)
  })
}

const deleteStoreItem = (itemId: string) => {
  return formDoc.collection("items").doc(itemId).delete();
};

type UpdateItemPayload = {
  id: string;
  before: Item;
  after: Partial<Item>
};
export class updateItem implements Command<UpdateItemPayload> {
  name = "updateItem";

  async invoke(item: Item, content: Partial<Item>) {
    updateStoreItem(item.id, content);
    return { id: item.id, before: item, after: content };
  }
  async undo({ id, before }: UpdateItemPayload) {
    updateStoreItem(id, before);
  }
  async redo({ id, after }: UpdateItemPayload) {
    updateStoreItem(id, after);
  }
}

type DeleteItemPayload = {
  id: string;
  before: Item;
};

export class deleteItem implements Command<DeleteItemPayload> {
  name = "deleteItem";

  async invoke(item: Item) {
    deleteStoreItem(item.id);
    removeItemFromForm(item.id)
    return {
      id: item.id,
      before: item,
    };
  }
  async undo({ id, before }: DeleteItemPayload) {
    updateStoreItem(id, before);
    pushItemToForm(id)
  }
  async redo({ id, before }: DeleteItemPayload) {
    deleteStoreItem(id);
    removeItemFromForm(id)
  }
}

const initialItem = (id: string) => ({
  id,
  type: "text",
  label: "title",
  placeholder: "",
});


export class createItem implements Command<string> {
  name = "createItem";

  async invoke() {
    const itemId = String(Number(new Date()));
    const item = initialItem(itemId)
    updateStoreItem(itemId, item);
    pushItemToForm(itemId)
    return itemId;
  }
  async undo(payload: string) {
    deleteStoreItem(payload);
    removeItemFromForm(payload)
  }
  async redo(payload: string) {
    const item = initialItem(payload)
    updateStoreItem(payload, item);
    pushItemToForm(payload)
  }
}

export const undoCommands: Record<string, Command> = {
  createItem: new createItem(),
  deleteItem: new deleteItem(),
  updateItem: new updateItem(),
};
