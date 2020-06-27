import { firestore } from "../firebase";

type State = any;
type GetState = () => State;

interface Command {
  invoke(getState: GetState): Promise<void>;
  undo(getState: GetState): Promise<void>;
  redo(getState: GetState): Promise<void>;
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
  constructor(public itemId: string, public content: any) {}

  async invoke(getState: GetState) {
    const state = getState();
    this.before = state.items.find((item: any) => item.id === this.itemId);

    return updateStoreItem(this.itemId, this.content);
  }
  async undo(getState: GetState) {
    return updateStoreItem(this.itemId, this.before);
  }
  async redo(getState: GetState) {
    throw new Error("Method not implemented.");
  }
}

export class deleteItem implements Command {
  item: any;

  constructor(public itemId: string) {}

  async invoke(getState: GetState) {
    const state = getState();
    this.item = state.items.find((item: any) => item.id === this.itemId);
    deleteStoreItem(this.itemId);
  }
  async undo(getState: GetState){
    updateStoreItem(this.itemId, this.item);
  }
  async redo(getState: GetState) {
    throw new Error("Method not implemented.");
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
  async undo(getState: GetState) {
    deleteStoreItem(this.itemId);
  }
  async redo() {
    throw new Error("Method not implemented.");
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
    await command.undo(this.getState)
    this.redoStack.push(command);
  }
}
