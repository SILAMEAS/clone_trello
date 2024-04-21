import { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import React from "react";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import {
  HandRaisedIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { useAtom } from "jotai";
import { containerAtom } from "@/jotai/task";
import useSWRMutation from "swr/mutation";
import { deleteTask } from "../../action";
import { Spinner } from "@nextui-org/react";
import { format } from "date-fns";

type ItemsType = {
  id: UniqueIdentifier;
  title: string;
  deadline?: Date;
  onActiveItem?: (id: UniqueIdentifier, forDelete?: boolean) => void;
  onOpenDeleteTaskModal?: () => void;
};

const Items = ({ id, title, onActiveItem, deadline }: ItemsType) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    data: {
      type: "item",
    },
  });

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        style={{
          transition,
          transform: CSS.Translate.toString(transform),
        }}
        className={clsx(
          "px-5 py-4 shadow-lg bg-background rounded-xl w-full  cursor-pointer",
          isDragging && "opacity-50"
        )}
      >
        <div className="flex items-center justify-between">
          <p>
            {title}{" "}
            {deadline && (
              <span
                className={`text-sm ${
                  new Date() > new Date(deadline) ? "text-red-500" : "text-primary-500"
                }`}
              >
                {format(deadline, "( dd-MM-yy )")}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="border p-2 text-xs active:scale-95 rounded-xl shadow-lg hover:shadow-xl"
              onClick={() => onActiveItem && onActiveItem(id)}
            >
              <PencilIcon className="w-5 h-5 text-secondary-500" />
            </button>
            <button
              className="border p-2 text-xs active:scale-95 rounded-xl shadow-lg hover:shadow-xl"
              onClick={() => onActiveItem && onActiveItem(id, true)}
            >
              <TrashIcon className="w-5 h-5 text-red-500" />
            </button>
            <button
              className="border p-2 text-xs rounded-xl shadow-lg hover:shadow-xl"
              {...listeners}
            >
              <HandRaisedIcon className="w-5 h-5 hover:cursor-grab text-primary-500" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Items;
