"use client";

import { useState } from "react";
import {
  Button,
  ColorPicker,
  Input,
  Modal,
  ModalHeader,
  type ColorOption,
} from "@/components/ui";
import { FolderIcon } from "./icons";
import {
  folderColors,
  folderEmojis,
  type FolderColor,
  type FolderItem,
} from "./types";

const colorOptions: ColorOption<FolderColor>[] = (
  Object.keys(folderColors) as FolderColor[]
).map((c) => ({
  value: c,
  label: folderColors[c].label,
  swatch: folderColors[c].swatch,
}));

export type FolderStyle = Pick<FolderItem, "name" | "color" | "emoji">;

export default function FolderStyleDialog({
  folder,
  onClose,
  onSave,
}: {
  folder: FolderItem;
  onClose: () => void;
  onSave: (style: FolderStyle) => void;
}) {
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color);
  const [emoji, setEmoji] = useState(folder.emoji);

  const emojiButton = (selected: boolean) =>
    `flex size-9 items-center justify-center rounded-lg text-lg transition-colors ${
      selected ? "bg-slate-200 ring-2 ring-slate-700" : "hover:bg-slate-100"
    }`;

  return (
    <Modal label="Customize folder" onClose={onClose}>
      <ModalHeader title="Customize folder" onClose={onClose} />
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name: name.trim() || folder.name, color, emoji });
        }}
      >
        <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 py-5">
          <FolderIcon color={color} emoji={emoji} size={96} />
          <span className="max-w-full truncate px-4 text-sm text-slate-600">
            {name || folder.name}
          </span>
        </div>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Folder name"
          placeholder="Folder name"
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-500">Color</span>
          <ColorPicker
            legend="Folder color"
            options={colorOptions}
            value={color}
            onChange={setColor}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-medium text-slate-500">
            Icon
          </legend>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              aria-pressed={emoji === null}
              onClick={() => setEmoji(null)}
              className={`${emojiButton(emoji === null)} text-xs text-slate-500`}
            >
              None
            </button>
            {folderEmojis.map((e) => (
              <button
                key={e}
                type="button"
                aria-label={`Icon ${e}`}
                aria-pressed={emoji === e}
                onClick={() => setEmoji(e)}
                className={emojiButton(emoji === e)}
              >
                {e}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
