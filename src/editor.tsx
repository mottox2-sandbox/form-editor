import React, { useState, useEffect } from "react";
import "./editor.css";
import { Input, Select, Button } from "antd";
import { PlusCircleTwoTone, DeleteTwoTone } from "@ant-design/icons";
import {
  CommandManager,
  createItem as createItemCommand,
  deleteItem as deleteItemCommand,
  updateItem as updateItemCommand,
} from "./commands/index";

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

const editorState: State = {
  items: [
    {
      id: "a",
      type: "text",
      label: "タイトル",
      placeholder: "",
    },
    {
      id: "b",
      type: "select",
      label: "選択項目",
      options: [
        {
          label: "選択肢1",
          value: "選択肢1",
        },
        {
          label: "選択肢2",
          value: "選択肢2",
        },
      ],
    },
  ],
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
          value={item.label}
          onChange={(event) => {
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

const history: any[] = [];

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

  render() {
    return <Editor state={this.state} manager={this.manager} />;
  }
}

export const Editor: React.FC<{
  state: State;
  manager: CommandManager;
}> = ({ manager, state }) => {
  const perform = (action: any): any => {
    return (...args: any) => {
      console.log("perform action:", action.name, args);
      history.push(`[${action.name}]: ${JSON.stringify(args)}`);
      action(...args);
    };
  };
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
              onChange={perform(updateItem)}
              onDelete={perform(deleteItem)}
              item={item}
              key={item.id}
            />
          );
        })}
        <Button onClick={() => perform(createItem)()}>
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
