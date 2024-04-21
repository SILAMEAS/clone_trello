"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DragCard from "./components/drag-card";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useAtom } from "jotai";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { v4 as uuidv4 } from "uuid";
import { CSS } from "@dnd-kit/utilities";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { Judge, judgeAtom, rootContainerTitle } from "@/jotai/judge";
import clsx from "clsx";
import {
  ArrowDownTrayIcon,
  Bars2Icon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import useSWR from "swr";
import { editProject, getProject, onEditContainer } from "../action";
import { toast } from "sonner";
import RootContainer from "./components/root-container";

type Props = {
  params: {
    id: string;
  };
};

const Page = ({ params: { id } }: Props) => {
  const [containers, setContainers] = useAtom(judgeAtom);
  const { data: project, isLoading } = useSWR("project" + id, getMyProject);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    if (project) {
      if (project.containers.length === 0) return;
      const containers: Judge[] = project.containers.map((container) => ({
        id: "container-" + container.id,
        title: container.title,
        items: container.items.map((item) => ({
          id: "item-" + item,
          image: item,
        })),
      }));
      setContainers(containers);
    }
  }, [project, setContainers]);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [containerName, setContainerName] = useState("");
  const {
    isOpen: isOpenContainerModal,
    onOpen: onOpenContainerModal,
    onOpenChange: onOpenContainerChange,
  } = useDisclosure();

  function getMyProject() {
    return getProject(id);
  }

  const onAddContainer = () => {
    if (!containerName) return;
    const id = `container-${uuidv4()}`;
    setContainers([
      ...containers,
      {
        id,
        title: containerName,
        items: [],
      },
    ]);
    setContainerName("");
    setIsSaved(false);
  };

  // Find the value of the items
  function findValueOfItems(id: UniqueIdentifier | undefined, type: string) {
    if (type === "container") {
      return containers.find((item) => item.id === id);
    }
    if (type === "item") {
      return containers.find((container) =>
        container.items.find((item) => item.id === id)
      );
    }
  }

  const findItemImage = (id: UniqueIdentifier | undefined) => {
    const container = findValueOfItems(id, "item");
    if (!container) return "";
    const item = container.items.find((item) => item.id === id);
    if (!item) return "";
    return item.image;
  };

  const findContainer = (id: UniqueIdentifier | undefined) => {
    return containers.find((item) => item.id === id);
  };

  // DND Handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const { id } = active;
    setActiveId(id);
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;

    // Handle Items Sorting
    if (
      active.id.toString().includes("item") &&
      over?.id.toString().includes("item") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active container and over container
      const activeContainer = findValueOfItems(active.id, "item");
      const overContainer = findValueOfItems(over.id, "item");

      // If the active or over container is not found, return
      if (!activeContainer || !overContainer) return;

      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === activeContainer.id
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === overContainer.id
      );

      // Find the index of the active and over item
      const activeitemIndex = activeContainer.items.findIndex(
        (item) => item.id === active.id
      );
      const overitemIndex = overContainer.items.findIndex(
        (item) => item.id === over.id
      );
      // In the same container
      if (activeContainerIndex === overContainerIndex) {
        let newItems = [...containers];
        newItems[activeContainerIndex].items = arrayMove(
          newItems[activeContainerIndex].items,
          activeitemIndex,
          overitemIndex
        );

        setContainers(newItems);
      } else {
        // In different containers
        let newItems = [...containers];
        const [removeditem] = newItems[activeContainerIndex].items.splice(
          activeitemIndex,
          1
        );
        newItems[overContainerIndex].items.splice(
          overitemIndex,
          0,
          removeditem
        );
        setContainers(newItems);
      }
    }

    // Handling Item Drop Into a Container
    if (
      active.id.toString().includes("item") &&
      over?.id.toString().includes("container") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active and over container
      const activeContainer = findValueOfItems(active.id, "item");
      const overContainer = findValueOfItems(over.id, "container");

      // If the active or over container is not found, return
      if (!activeContainer || !overContainer) return;

      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === activeContainer.id
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === overContainer.id
      );

      // Find the index of the active and over item
      const activeitemIndex = activeContainer.items.findIndex(
        (item) => item.id === active.id
      );

      // Remove the active item from the active container and add it to the over container
      let newItems = [...containers];
      const [removeditem] = newItems[activeContainerIndex].items.splice(
        activeitemIndex,
        1
      );
      newItems[overContainerIndex].items.push(removeditem);
      setContainers(newItems);
    }
    setIsSaved(true);
  };

  // This is the function that handles the sorting of the containers and items when the user is done dragging.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // Handling Container Sorting
    if (
      active.id.toString().includes("container") &&
      over?.id.toString().includes("container") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === active.id
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === over.id
      );
      // Swap the active and over container
      let newItems = [...containers];
      newItems = arrayMove(newItems, activeContainerIndex, overContainerIndex);
      setContainers(newItems);
    }

    // Handling item Sorting
    if (
      active.id.toString().includes("item") &&
      over?.id.toString().includes("item") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active and over container
      const activeContainer = findValueOfItems(active.id, "item");
      const overContainer = findValueOfItems(over.id, "item");

      // If the active or over container is not found, return
      if (!activeContainer || !overContainer) return;
      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === activeContainer.id
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === overContainer.id
      );
      // Find the index of the active and over item
      const activeitemIndex = activeContainer.items.findIndex(
        (item) => item.id === active.id
      );
      const overitemIndex = overContainer.items.findIndex(
        (item) => item.id === over.id
      );

      // In the same container
      if (activeContainerIndex === overContainerIndex) {
        let newItems = [...containers];
        newItems[activeContainerIndex].items = arrayMove(
          newItems[activeContainerIndex].items,
          activeitemIndex,
          overitemIndex
        );
        setContainers(newItems);
      } else {
        // In different containers
        let newItems = [...containers];
        const [removeditem] = newItems[activeContainerIndex].items.splice(
          activeitemIndex,
          1
        );
        newItems[overContainerIndex].items.splice(
          overitemIndex,
          0,
          removeditem
        );
        setContainers(newItems);
      }
    }
    // Handling item dropping into Container
    if (
      active.id.toString().includes("item") &&
      over?.id.toString().includes("container") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active and over container
      const activeContainer = findValueOfItems(active.id, "item");
      const overContainer = findValueOfItems(over.id, "container");

      // If the active or over container is not found, return
      if (!activeContainer || !overContainer) return;
      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === activeContainer.id
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === overContainer.id
      );
      // Find the index of the active and over item
      const activeitemIndex = activeContainer.items.findIndex(
        (item) => item.id === active.id
      );

      let newItems = [...containers];
      const [removeditem] = newItems[activeContainerIndex].items.splice(
        activeitemIndex,
        1
      );
      newItems[overContainerIndex].items.push(removeditem);
      setContainers(newItems);
    }
    setActiveId(null);
    setIsSaved(false);
  }

  const _containers = useMemo(() => {
    return containers.filter((c) => c.title !== rootContainerTitle);
  }, [containers]);

  const onSave = useCallback(
    (_containers?: Judge[]) => {
      const processing = editProject(id, _containers ?? containers);
      toast.promise(processing, {
        loading: "Saving...",
        success: "Saved !",
        error: "Failed to save",
        duration: 1000,
      });
      setIsSaved(true);
    },
    [containers, id]
  );

  useEffect(() => {
    const oneMinute = 2 * 1000 * 60; // milliseconds = 5 minute
    const interval = setInterval(() => {
      onSave();
    }, oneMinute);

    return () => clearInterval(interval);
  }, [onSave]);

  useEffect(() => {
    if (isSaved) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSaved]);

  const [uploading, setUploading] = useState<boolean>(false);
  const [edit, setEdit] = useState<string>("");

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <Button
        className="fixed bottom-10 left-10"
        isIconOnly
        variant="shadow"
        color={uploading ? "default" : "primary"}
        onClick={onOpenContainerModal}
        disabled={uploading}
      >
        <PlusIcon className="h-6 w-6" />
      </Button>

      <Button
        className="fixed bottom-10 right-10"
        isIconOnly
        variant="shadow"
        color="primary"
        onClick={() => onSave()}
      >
        <ArrowDownTrayIcon className="h-6 w-6" />
      </Button>

      <Modal isOpen={isOpenContainerModal} onOpenChange={onOpenContainerChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Add Container
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col w-full items-start gap-y-4">
                  <Input
                    type="text"
                    placeholder="Container Title"
                    name="containername"
                    value={containerName}
                    onChange={(e) => setContainerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onAddContainer();
                        onClose();
                      }
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onClick={() => {
                    onAddContainer();
                    onClose();
                  }}
                >
                  Add
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <main className="container h-[calc(100vh-6rem)] flex items-center gap-5">
        <section className="h-full w-[100%] px-5 border bg-default-50 overflow-auto">
          {!isLoading && containers.length === 1 && (
            <p className="text-center mt-20">Create a container 🤨</p>
          )}

          <SortableContext items={_containers.map((i) => i.id)}>
            {_containers.map((container) => (
              <Container
                container={container}
                key={container.id}
                edit={edit}
                setEdit={setEdit}
                setIsSaved={setIsSaved}
              />
            ))}
          </SortableContext>

          <DragOverlay adjustScale={false}>
            {activeId && activeId.toString().includes("item") && (
              <DragCard id={activeId} image={findItemImage(activeId)} />
            )}
            {activeId && activeId.toString().includes("container") && (
              <Container container={findContainer(activeId)!} />
            )}
          </DragOverlay>
        </section>
        <RootContainer
          onSave={onSave}
          setUploading={setUploading}
          setIsSaved={setIsSaved}
        />
      </main>
    </DndContext>
  );
};

export default Page;

type ContainerProps = {
  container: Judge;
  setEdit?: React.Dispatch<React.SetStateAction<string>>;
  edit?: string;
  setIsSaved?: React.Dispatch<React.SetStateAction<boolean>>;
};

function Container({
  container: { id, title, items },
  edit,
  setEdit,
  setIsSaved,
}: ContainerProps) {
  const {
    attributes,
    setNodeRef,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    data: {
      type: "container",
    },
  });

  const [containers, setContainers] = useAtom(judgeAtom);

  function onRemoveContainer(id: UniqueIdentifier) {
    const _containers = containers.filter((c) => c.id !== id);
    setContainers(_containers);
    setIsSaved && setIsSaved(false);
  }

  const [editTitle, setEditTitle] = useState<string>(title);
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
    onEditContainer(id.replace("container-", ""), editTitle);
    setEdit && setEdit("");
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
        "h-40 border-b rounded-none flex gap-5 items-center cursor-default w-full",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          className=" p-2 rounded-xl cursor-grab active:cursor-grabbing"
          {...listeners}
        >
          <Bars2Icon className="w-5 h-5 hover:text-primary text-default-500" />
        </button>
        <button onClick={() => onRemoveContainer(id)}>
          <TrashIcon className="w-5 h-5 hover:text-danger-500 text-default-500" />
        </button>
      </div>
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
        <h3
          className="text-xl font-medium w-36 cursor-pointer truncate border-r rounded-none pl-5"
          onClick={() => setEdit && setEdit(id)}
        >
          {title}
        </h3>
      )}

      <SortableContext items={items.map((i) => i.id)}>
        <div className="flex space-x-5">
          {items.map((i) => (
            <DragCard image={i.image} id={i.id} key={i.id} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
