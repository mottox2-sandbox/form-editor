import React, { useState, useCallback, memo } from "react";
import "./editor.css";
import { Input, Select, Button } from "antd";
import { PlusCircleTwoTone, DeleteTwoTone } from "@ant-design/icons";
import {
  CommandManager,
  createItem as createItemCommand,
  deleteItem as deleteItemCommand,
  updateItem as updateItemCommand,
  Command,
} from "./commands/index";
import { firestore } from "./firebase";

const Option = Select.Option;

type ItemBase = {
  type: string;
  label: string;
  id: string;
};

type TextItem = ItemBase & {
  type: "text";
  placeholder: string;
};

type SelectItem = ItemBase & {
  type: "select";
  options: {
    label: string;
    value: string;
  }[];
};

type Item = TextItem | SelectItem;
type State = {
  items: Item[];
};

const TypeSelect: React.FC<{
  onChange: (newType: string) => void;
  value: string;
}> = ({ onChange, value }) => (
  <Select
    style={{ width: 100 }}
    onChange={(newValue) => {
      onChange(newValue);
    }}
    value={value}
  >
    <Option value="text">text</Option>
    <Option value="select">select</Option>
  </Select>
);

const FormItem = memo(
  ({
    item,
    onChange,
    onDelete,
  }: {
    item: Item;
    onChange: any;
    onDelete: any;
  }) => {
    const [label, setLabel] = useState(item.label);
    const [editing, setEditing] = useState(false);

    return (
      <div className="editor-item">
        <div>
          <div className="editor-item-label">タイプ</div>
          <TypeSelect
            value={item.type}
            onChange={(newType: string) => {
              onChange(item.id, { type: newType });
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div className="editor-item-label">ラベル</div>
          <Input
            type="text"
            value={label}
            onChange={(event) => {
              setLabel(event.target.value);
              setEditing(true);
            }}
            onBlur={(event) => {
              if (editing) onChange(item.id, { label: event.target.value });
              setEditing(false);
            }}
          />
        </div>
        <div>
          <Button onClick={() => onDelete(item.id)}>
            <DeleteTwoTone />
          </Button>
        </div>
      </div>
    );
  }
);


const PreviewItem: React.FC<{
  item: Item;
}> = memo(({ item }) => {
  if (item.type === "select")
    return (
      <div key={item.id}>
        {item.label}
        <br />
        <Select style={{ width: 200 }}>
          aaa
          {item.options?.map((option, index) => {
            return (
              <Option value={option.value} key={index}>
                {option.label}
              </Option>
            );
          })}
        </Select>
      </div>
    );

  return (
    <label key={item.id}>
      {item.label}
      <Input type={item.type} />
    </label>
  );
});

export class EditorClass extends React.Component<{}, State> {
  manager: CommandManager;

  constructor(props: any) {
    super(props);
    this.state = {
      items: [],
    };
    this.manager = new CommandManager(() => this.state);
  }

  componentDidMount() {
    firestore
      .doc("forms/6aB798wMx3sP02ZK26C9")
      .collection("items")
      .onSnapshot((snapshot) => {
        let items: Item[] = [];
        snapshot.docs.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Item);
          this.setState({ items });
        });
      });
  }

  render() {
    return <Editor state={this.state} manager={this.manager} />;
  }
}

const useSetStore = () => {
  const invoke = (action: Command, getStore: any) => {
    action.invoke(getStore);
    console.log(action.record());
  };

  return { invoke };
};

export const Editor: React.FC<{
  state: State;
  manager: CommandManager;
}> = ({ manager, state }) => {
  const [histories, setHistories] = useState<any>([]);
  const { invoke } = useSetStore();
  const createItem = () => {
    const cmd = new createItemCommand();
    manager?.invoke(cmd);
    // invoke(cmd, () => state)
    setHistories((hist: any[]) => [...hist, cmd]);
  };
  const updateItem = useCallback(
    (itemId: string, content: any) => {
      const cmd = new updateItemCommand(itemId, content);
      // invoke(cmd, () => state)
      manager?.invoke(cmd);
      setHistories((hist: any[]) => [...hist, cmd]);
    },
    [manager]
  );
  const deleteItem = useCallback(
    (itemId: string) => {
      const cmd = new deleteItemCommand(itemId);
      // invoke(cmd, () => state)
      manager?.invoke(cmd);
      setHistories((hist: any[]) => [...hist, cmd]);
    },
    [manager]
  );

  return (
    <div className="container">
      <div className="editor">
        {JSON.stringify(histories)}
        {state.items.map((item) => {
          return (
            <FormItem
              onChange={updateItem}
              onDelete={deleteItem}
              item={item}
              key={item.id}
            />
          );
        })}
        <Button onClick={createItem}>
          <PlusCircleTwoTone />
          項目を追加
        </Button>
      </div>
      <div className="preview">
        {state.items.map((item) => {
          return <PreviewItem item={item} key={item.id} />
        })}
        <h1>History</h1>
        <button
          onClick={() => {
            manager?.undo();
          }}
        >
          undo
        </button>
        {manager?.undoStack.map((stack, index) => {
          return (
            <div key={index}>
              {stack.constructor.name}
              <br />
              <span style={{ fontSize: 10 }}>{JSON.stringify(stack)}</span>
            </div>
          );
        })}
        <hr />
        {manager?.redoStack.map((stack, index) => {
          return (
            <div key={index}>
              {stack.constructor.name}
              <br />
              <span style={{ fontSize: 10 }}>{JSON.stringify(stack)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
