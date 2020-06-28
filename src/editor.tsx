import React, { useState, useCallback, memo, useEffect } from "react";
import "./editor.css";
import { Input, Select, Button } from "antd";
import { PlusCircleTwoTone, DeleteTwoTone } from "@ant-design/icons";
import {
  createItem as createItemCommand,
  deleteItem as deleteItemCommand,
  updateItem as updateItemCommand,
  Command,
  undoCommands,
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

export type Item = TextItem | SelectItem;
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

    useEffect(() => {
      setLabel(item.label);
    }, [item]);

    return (
      <div className="editor-item">
        <div>
          <div className="editor-item-label">タイプ</div>
          <TypeSelect
            value={item.type}
            onChange={(newType: string) => {
              onChange(item, { type: newType });
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
              if (editing) onChange(item, { label: event.target.value });
              setEditing(false);
            }}
          />
        </div>
        <div>
          <Button onClick={() => onDelete(item)}>
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
  constructor(props: any) {
    super(props);
    this.state = {
      items: [],
    };
  }

  componentDidMount() {
    firestore
      .doc("forms/6aB798wMx3sP02ZK26C9")
      .collection("items")
      .onSnapshot((snapshot) => {
        let items: Item[] = [];
        snapshot.docChanges().forEach((change) => {
          console.log(change.type, change.doc.data());
        });
        snapshot.docs.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Item);
          this.setState({ items });
        });
      });
  }

  render() {
    return <Editor state={this.state} />;
  }
}

const useSetStore = () => {
  const [histories, setHistories] = useState<any>([]);
  const invoke = (action: Command, getStore: any) => {
    console.log(action);
    action.invoke(getStore);
    setHistories((hist: any[]) => [...hist, action.record()]);
    // console.log(action.record());
  };

  const undo = () => {
    const history = histories.pop();
    if (!history) return;
    const cmd = undoCommands[history.name];
    if (cmd) cmd.undo(history.payload);
  };

  return { histories, invoke, undo };
};

export const Editor: React.FC<{
  state: State;
}> = ({ state }) => {
  const { invoke, histories, undo } = useSetStore();
  const createItem = () => {
    const cmd = new createItemCommand();
    invoke(cmd, () => state);
  };
  const updateItem = useCallback((item: Item, content: any) => {
    const cmd = new updateItemCommand(item, content);
    invoke(cmd, () => state);
  }, []);
  const deleteItem = useCallback((item: Item) => {
    const cmd = new deleteItemCommand(item);
    invoke(cmd, () => state);
  }, []);

  return (
    <div className="container">
      <div className="editor">
        {JSON.stringify(histories)}
        <button onClick={undo}>Undo</button>
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
          return <PreviewItem item={item} key={item.id} />;
        })}
      </div>
    </div>
  );
};
