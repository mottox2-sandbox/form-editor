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
  before: any
  constructor(public itemId: string, public content: any) {}

  async invoke(getState: GetState): Promise<ActionResult> {
    const state = getState();
    this.before = state.items.find((item: any) => item.id === this.itemId);
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
  async undo(getState: GetState): Promise<ActionResult> {
    const state = getState();
    return {
      newState: {
        ...state,
        items: state.items.map((item: any) => {
          if (item.id !== this.itemId) return item;
          else return this.before;
        }),
      },
    };
  }
  redo(getState: GetState): Promise<ActionResult> {
    throw new Error("Method not implemented.");
  }
}

export class deleteItem implements Command {
  item: any;

  constructor(public itemId: string) {}

  async invoke(getState: GetState): Promise<ActionResult> {
    const state = getState();
    this.item = state.items.find((item: any) => item.id === this.itemId);
    return {
      newState: {
        ...state,
        items: state.items.filter((item: any) => item.id !== this.itemId),
      },
    };
  }
  async undo(getState: GetState): Promise<ActionResult> {
    const state = getState();
    return {
      newState: {
        ...state,
        items: [...state.items, this.item],
      },
    };
  }
  redo(getState: GetState): Promise<ActionResult> {
    throw new Error("Method not implemented.");
  }
}

export class createItem implements Command {
  itemId: string;

  constructor() {
    this.itemId = String(Number(new Date()));
  }

  async invoke(getState: GetState) {
    const state = getState();
    return {
      newState: {
        ...state,
        items: [
          ...state.items,
          {
            id: this.itemId,
            type: "text",
            label: "title",
            placeholder: "",
          },
        ],
      },
    };
  }
  async undo(getState: GetState) {
    const state = getState();
    return {
      newState: {
        ...state,
        items: state.items.filter((item: any) => item.id !== this.itemId),
      },
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
