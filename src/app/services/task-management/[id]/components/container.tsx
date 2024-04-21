import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Button } from "@nextui-org/react";
import { Bars2Icon, PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { useAtom } from "jotai";
import { containerAtom } from "@/jotai/task";
import { UniqueIdentifier } from "@dnd-kit/core";
import { onEditContainer } from "../../action";

type ContainerProps = {
  id: UniqueIdentifier | string;
  children: React.ReactNode;
  title: string;
  onAddItem?: () => void;
  setEdit?: React.Dispatch<React.SetStateAction<string>>;
  edit?: string;
  setIsSaved?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Container = ({
  id,
  children,
  title,
  onAddItem,
  edit,
  setEdit,
  setIsSaved
}: ContainerProps) => {
  const {
    attributes,
    setNodeRef,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "container",
    },
  });

  const [editTitle, setEditTitle] = useState<string>(title);
  const [containers, setContainers] = useAtom(containerAtom);

  async function onEditName() {
    if (!editTitle) return;

    setContainers(
      containers.map((c) =>
        c.id === id
          ? {
              ...c,
              title: editTitle,
            }
          : c
      )
    );
    onEditContainer(String(id).replace("container-", ""), editTitle);
    setEdit && setEdit("");
  }

  function onRemoveContainer(id: UniqueIdentifier) {
    const _containers = containers.filter((c) => c.id !== id);
    setContainers(_containers);
    setIsSaved && setIsSaved(false);
  }

  return (
    <div
      {...attributes}
      ref={setNodeRef}
      style={{
        transition,
        transform: CSS.Translate.toString(transform),
      }}
      className={clsx(
        "w-full h-full p-4 bg-default-50 cursor-default rounded-xl flex flex-col gap-y-4",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-1">
          {edit === id ? (
            <input
              placeholder="Edit ..."
              className="max-w-36 border-none bg-transparent outline-none text-xl font-medium rounded-none"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onEditName();
                }
              }}
              onBlur={() => setEditTitle(title)}
            />
          ) : (
            <div className="flex items-center gap-5">
              <button onClick={() => onRemoveContainer(id)}>
                <TrashIcon className="w-5 h-5 hover:text-danger-500 text-default-500" />
              </button>
              <h1
                className="text-xl cursor-pointer"
                onClick={() => setEdit && setEdit(id as string)}
              >
                {title}
              </h1>
            </div>
          )}
        </div>
        <button
          className=" p-2 rounded-xl cursor-grab active:cursor-grabbing"
          {...listeners}
        >
          <Bars2Icon className="w-5 h-5 hover:text-primary text-default-500" />
        </button>
      </div>

      {children}
      <Button
        variant="flat"
        onClick={onAddItem}
        endContent={<PlusIcon className="w-5 h-5" />}
      >
        Add Task
      </Button>
    </div>
  );
};

export default Container;
