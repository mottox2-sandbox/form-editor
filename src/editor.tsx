import React, { useState, useCallback, memo, useEffect } from "react";
import "./editor.css";
import { Input, Select, Button } from "antd";
import {
  PlusCircleTwoTone,
  DeleteTwoTone,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  createItem as createItemCommand,
  deleteItem as deleteItemCommand,
  updateItem as updateItemCommand,
  Command,
  undoCommands,
} from "./commands/index";
import { firestore } from "./firebase";
import { useDispatch, useSelector } from "react-redux";
import { historyActions } from "./store";

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

type Form = {
  name: string;
  itemIds: string[];
};

export type Item = TextItem | SelectItem;
type State = {
  items: Record<string, Item>;
  form: Form;
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
      items: {},
      form: {
        name: "",
        itemIds: [],
      },
    };
  }

  componentDidMount() {
    const doc = firestore.doc("forms/6aB798wMx3sP02ZK26C9");
    doc.onSnapshot((snapshot) => {
      const form = snapshot.data() as Form;
      this.setState({ form });
    });
    doc.collection("items").onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const item = { id: change.doc.id, ...change.doc.data() } as Item;
        this.setState({
          items: { ...this.state.items, [change.doc.id]: item },
        });
      });
    });
  }

  render() {
    return <Editor state={this.state} />;
  }
}

const useStoreWriter = () => {
  const dispatch = useDispatch();
  const invoke = async (action: Command, ...args: any) => {
    const name = action.name;
    const payload = await action.invoke(...args);
    dispatch(
      historyActions.pushHistory({
        name,
        payload,
      })
    );
  };

  return { invoke };
};

const useStoreHistory = () => {
  const histories: any[] = useSelector((state: any) => state.history.histories);
  const dispatch = useDispatch();

  const undo = () => {
    const history = histories[histories.length - 1];
    dispatch(historyActions.popHistory());
    if (!history) return;
    const cmd = undoCommands[history.name];
    if (cmd) cmd.undo(history.payload);
  };

  return { histories, undo };
};

const HistoryUI = () => {
  const { histories, undo } = useStoreHistory();
  return (
    <div className="histories">
      <div>
        <Button onClick={undo}>
          <ArrowLeftOutlined />
          Undo
        </Button>
      </div>
      {histories.map((history: any, index: number) => {
        return (
          <div key={index}>
            <b>{history.name}</b>
            <br />
            <small>{JSON.stringify(history.payload)}</small>
          </div>
        );
      })}
    </div>
  );
};

export const Editor: React.FC<{
  state: State;
}> = ({ state }) => {
  const { invoke } = useStoreWriter();
  const createItem = () => {
    const cmd = new createItemCommand();
    invoke(cmd);
  };
  const updateItem = useCallback((item: Item, content: any) => {
    const cmd = new updateItemCommand();
    invoke(cmd, item, content);
  }, []);
  const deleteItem = useCallback((item: Item) => {
    const cmd = new deleteItemCommand();
    invoke(cmd, item);
  }, []);

  return (
    <div className="container">
      <div className="editor">
        <div>{(state.form.itemIds || []).join(", ")}</div>
        {state.form.itemIds.map((itemId) => {
          const item = state.items[itemId];
          if (!item) return null;
          return (
            <FormItem
              onChange={updateItem}
              onDelete={deleteItem}
              item={state.items[itemId]}
              key={itemId}
            />
          );
        })}
        <Button onClick={createItem}>
          <PlusCircleTwoTone />
          項目を追加
        </Button>
      </div>
      <div className="right">
        <div className="preview">
          {state.form.itemIds.map((itemId) => {
            const item = state.items[itemId];
            if (!item) return null;
            return <PreviewItem item={item} key={itemId} />;
          })}
        </div>
        <HistoryUI />
      </div>
    </div>
  );
};
