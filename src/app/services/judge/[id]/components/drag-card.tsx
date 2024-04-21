import { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import Image from "next/image";
import React from "react";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { TrashIcon } from "@heroicons/react/16/solid";
import { Button } from "@nextui-org/react";

type Props = {
  id: UniqueIdentifier;
  image: string;
  deleteItem?: (id: string) => void;
  deletingImage?: string;
};

const DragCard = ({ id, image, deleteItem, deletingImage }: Props) => {
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
    <div className="relative h-36 w-36  ">
      {deleteItem && (
        <Button
          isIconOnly
          className="absolute  right-2 top-2 "
          size="sm"
          color="danger"
          onClick={() => deleteItem(image)}
          disabled={deletingImage === image}
          isLoading={deletingImage === image}
        >
          <TrashIcon className=" h-5 w-5 " />
        </Button>
      )}
      <Image
        style={{
          transition,
          transform: CSS.Translate.toString(transform),
        }}
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        src={image}
        width={200}
        height={200}
        priority
        alt=""
        className={clsx(
          "border object-cover hover:cursor-grab h-full w-full",
          isDragging && "opacity-50"
        )}
      />
    </div>
  );
};

export default DragCard;
