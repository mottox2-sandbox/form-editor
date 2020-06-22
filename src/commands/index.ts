type ActionResult = {
  newState: any;
};

type State = any;
type GetState = () => State;

interface Command {
  invoke(getState: GetState): Promise<ActionResult>;
  undo(getState: GetState): Promise<ActionResult>;
  redo(getState: GetState): Promise<ActionResult>;
}

export class updateItem implements Command {
  constructor(public itemId: string, public content: any) {}

  async invoke(getState: GetState): Promise<ActionResult> {
    const state = getState();
    return {
      newState: {
        ...state,
        items: state.items.map((item: any) => {
          if (item.id !== this.itemId) return item;
          else return { ...item, ...this.content };
        }),
      },
    };
  }
  undo(getState: GetState): Promise<ActionResult> {
    throw new Error("Method not implemented.");
  }
  redo(getState: GetState): Promise<ActionResult> {
    throw new Error("Method not implemented.");
  }
}

export class deleteItem implements Command {
  constructor(public itemId: string) {}

  async invoke(getState: GetState): Promise<ActionResult> {
    const state = getState();
    return {
      newState: {
        ...state,
        items: state.items.filter((item: any) => item.id !== this.itemId),
      },
    };
  }
  undo(getState: GetState): Promise<ActionResult> {
    throw new Error("Method not implemented.");
  }
  redo(getState: GetState): Promise<ActionResult> {
    throw new Error("Method not implemented.");
  }
}

export class createItem implements Command {
  async invoke(getState: GetState) {
    const state = getState();
    return {
      newState: {
        ...state,
        items: [
          ...state.items,
          {
            id: String(Number(new Date())),
            type: "text",
            label: "title",
            placeholder: "",
          },
        ],
      },
    };
  }
  async undo() {
    return {
      newState: {},
    };
  }
  async redo() {
    return {
      newState: {},
    };
  }
}

export class CommandManager {
  undoStack: Command[];
  redoStack: Command[];
  updater: (newState: any) => void;
  getState: GetState;

  constructor(updater: (args: any) => void, getState: GetState) {
    this.undoStack = [];
    this.redoStack = [];
    this.updater = updater;
    this.getState = getState;
  }

  async invoke(command: Command) {
    this.updater(await command.invoke(this.getState));
    this.undoStack.push(command);
    this.redoStack.length = 0;
    console.log(this);
  }

  async undo() {
    if (this.undoStack.length === 0) return;
    const command = this.undoStack.pop()!;
    this.updater(await command.undo(this.getState));
    this.redoStack.push(command);
  }
}
