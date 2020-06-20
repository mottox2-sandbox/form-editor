import React, { useState } from "react";
import "./editor.css";
import { Input, Select, Button } from "antd";
import { PlusCircleTwoTone } from "@ant-design/icons";

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

const editorState: {
  items: Item[];
} = {
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

const FormItem = ({ item, onChange }: { item: Item; onChange: any }) => {
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
    </div>
  );
};

const history: any[] = []

export const Editor = () => {
  const [state, update] = useState(editorState);
  const perform = (action: any): any => {
    return (...args: any) => {
      console.log("perform action:", action.name, args);
      history.push( `[${action.name}]: ${JSON.stringify(args)}`)
      action(...args);
    };
  };
  const createItem = () => {
    update({
      ...state,
      items: [
        ...state.items,
        {
          id: "a" + Number(new Date()),
          type: "text",
          label: "タイトル",
          placeholder: "",
        },
      ],
    });
  };
  const updateItem = (itemId: string, content: any) => {
    update({
      ...state,
      items: state.items.map((item) => {
        if (item.id !== itemId) return item;
        else return { ...item, ...content };
      }),
    });
  };
  console.log(history)

  return (
    <div className="container">
      <div className="editor">
        {state.items.map((item) => {
          return (
            <FormItem
              onChange={perform(updateItem)}
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
      </div>
    </div>
  );
};
