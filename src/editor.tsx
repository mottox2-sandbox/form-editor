import React, { useState } from "react";
import "./editor.css";

type TextItem = {
  type: "text";
  label: string;
  placeholder: string;
};

type SelectItem = {
  type: "select";
  label: string;
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
      type: "text",
      label: "タイトル",
      placeholder: "",
    },
    {
      type: "select",
      label: "選択項目",
      options: [],
    },
  ],
};

const TypeSelect: React.FC<{
  onChange: (newType: string) => void;
  value: string;
}> = ({ onChange, value }) => (
  <select
    onChange={(e) => {
      onChange(e.target.value);
    }}
    value={value}
  >
    <option value="text">text</option>
    <option value="select">select</option>
  </select>
);

export const Editor = () => {
  const [state, update] = useState(editorState);

  return (
    <div className="container">
      <div className="editor">
        {state.items.map((item) => {
          return (
            <div>
              type
              <TypeSelect
                value={item.type}
                onChange={(newType: string) => {}}
              />
              <br />
              label
              <input type="text" value={item.label} onChange={() => {}} />
            </div>
          );
        })}
      </div>
      <div className="preview">
        {state.items.map((item) => {
          if (item.type === "select")
            return (
              <div>
                {item.label}
                <select>
                  {item.options.map((option) => {
                    return <option value={option.value}>{option.label}</option>;
                  })}
                </select>
              </div>
            );

          return (
            <label>
              {item.label}
              <input type={item.type} />
            </label>
          );
        })}
      </div>
    </div>
  );
};
