import React, { useState } from "react";
import "./editor.css";
import { Input, Select, Button } from "antd";
import { PlusCircleTwoTone, DeleteTwoTone } from "@ant-design/icons";
import {
  CommandManager,
  createItem as createItemCommand,
  deleteItem as deleteItemCommand,
  updateItem as updateItemCommand,
} from "./commands/index";
import { firestore } from './firebase'

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

const FormItem = ({
  item,
  onChange,
  onDelete,
}: {
  item: Item;
  onChange: any;
  onDelete: any;
}) => {
  const [label, setLabel] = useState(item.label)

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
            setLabel(event.target.value)
          }}
          onBlur={(event) => {
            onChange(item.id, { label: event.target.value });
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
};

export class EditorClass extends React.Component<{}, State> {
  manager: CommandManager;

  constructor(props: any) {
    super(props);
    this.state = {
      items: [],
    };
    this.manager = new CommandManager(
      (result: any) => this.setState(result.newState),
      () => this.state
    );
  }

  componentDidMount() {
    firestore.doc('forms/6aB798wMx3sP02ZK26C9').collection('items').get()
    .then((snapshot) => {
      let items: Item[] = []
      snapshot.docs.forEach(doc => {
        items.push({id: doc.id, ...doc.data()} as Item)
        this.setState({ items })
      })
    })
  }

  render() {
    return <Editor state={this.state} manager={this.manager} />;
  }
}

export const Editor: React.FC<{
  state: State;
  manager: CommandManager;
}> = ({ manager, state }) => {
  const createItem = () => {
    manager?.invoke(new createItemCommand());
  };
  const updateItem = (itemId: string, content: any) => {
    const cmd = new updateItemCommand(itemId, content);
    manager?.invoke(cmd);
  };
  const deleteItem = (itemId: string) => {
    const cmd = new deleteItemCommand(itemId);
    manager?.invoke(cmd);
  };

  return (
    <div className="container">
      <div className="editor">
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
          if (item.type === "select")
            return (
              <div key={item.id}>
                {item.label}
                <br />
                <Select style={{ width: 200 }}>
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
        redo
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
