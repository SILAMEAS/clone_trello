"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// DnD
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
  useDisclosure,
} from "@nextui-org/react";
import Items from "./components/item";
import Container from "./components/container";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/16/solid";
import { useAtom } from "jotai";
import { containerAtom, TaskPatial, TaskType } from "@/jotai/task";
import useSWR from "swr";
import {
  deleteTask,
  editProject,
  editTask,
  getProject,
  getTask,
} from "../action";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import { compareAsc, format } from "date-fns";

type Props = {
  params: { id: string };
};

export default function TaskManagement({ params: { id } }: Props) {
  const [isSaved, setIsSaved] = useState(true);

  const {
    data: project,
    isLoading,
    mutate: mutateProject,
  } = useSWR("task-project" + id, getMyProject);

  const [editProjectLoading, setEditProjectLoading] = useState(false);
  const [containers, setContainers] = useAtom(containerAtom);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [currentContainerId, setCurrentContainerId] =
    useState<UniqueIdentifier>();
  const [containerName, setContainerName] = useState("");
  const [itemName, setItemName] = useState("");
  const {
    isOpen: isOpenContainerModal,
    onOpen: onOpenContainerModal,
    onOpenChange: onOpenContainerChange,
    onClose: onCloseContainerModal,
  } = useDisclosure();
  const {
    isOpen: isAddTaskModalOpen,
    onOpen: onOpenAddTaskModal,
    onOpenChange: onOpenChangeTaskModal,
    onClose: onCloseAddTaskModal,
  } = useDisclosure();
  const {
    isOpen: isDeleteTaskModalOpen,
    onOpen: onOpenDeleteTaskModal,
    onOpenChange: onDeleteOpenChangeTaskModal,
    onClose: onCloseDeleteTaskModal,
  } = useDisclosure();

  useEffect(() => {
    if (project) {
      if (project.containers.length === 0) return;
      const containers: TaskType[] = project.containers.map((container) => ({
        id: "container-" + container.id,
        title: container.title,
        items: container.tasks.map((item) => ({
          id: "item-" + item.id,
          name: item.name,
          description: item.description,
          deadline: item.deadline,
          createdAt: item.createdAt,
        })),
      }));
      setContainers(containers);
    }
  }, [project, setContainers]);

  const [taskId, setTaskId] = useState<string>();
  const [deleteTaskId, setDeleteId] = useState<string>();

  const { data, isLoading: singleItemLoading } = useSWR(
    taskId ? `item-${taskId}` : null,
    getSingleTask
  );

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
    onCloseContainerModal();

    setIsSaved(false);
  };

  const onAddTask = async () => {
    if (!itemName || !deadline) return;
    setEditProjectLoading(true);
    const newId = `item-${uuidv4()}`;
    const newContainers = containers.map((container) => {
      return container.id === currentContainerId
        ? {
            ...container,
            items: [
              ...container.items,
              {
                id: newId,
                name: itemName,
                deadline: new Date(deadline),
              },
            ],
          }
        : container;
    });
    editProject(id, newContainers)
      .then(() => {
        mutateProject().then(() => {
          setItemName("");
          onCloseAddTaskModal();
          setEditProjectLoading(false);
          setDeadline("");
        });
      })
      .catch((e) => {
        toast.error(e.message);
        setEditProjectLoading(false);
      });
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

  const findItemById = (
    id: UniqueIdentifier | undefined
  ): TaskPatial | undefined => {
    const container = findValueOfItems(id, "item");
    if (!container) return undefined;
    const item = container.items.find((item) => item.id === id);
    if (!item) return undefined;
    return item;
  };

  const findContainerTitle = (id: UniqueIdentifier | undefined) => {
    const container = findValueOfItems(id, "container");
    if (!container) return "";
    return container.title;
  };

  const findContainerItems = (id: UniqueIdentifier | undefined) => {
    const container = findValueOfItems(id, "container");
    if (!container) return [];
    return container.items;
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

    setIsSaved(false);
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

  // db call
  function getMyProject() {
    return getProject(id);
  }

  const onSave = useCallback(
    async (_containers?: TaskType[]) => {
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

  function getSingleTask() {
    if (!taskId) return;
    return getTask(taskId);
  }
  const [edit, setEdit] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editTaskName, setEditTaskName] = useState<string>("");
  const [editTaskDescription, setEditTaskDescription] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const { trigger, isMutating: updateTaskLoading } = useSWRMutation(
    "editTask" + taskId,
    onEditTask
  );

  const { trigger: onDeleteTask, isMutating: deleteTaskLoading } =
    useSWRMutation("task-project", onRemoveTask);

  function onActiveItem(id: UniqueIdentifier, forDelete?: boolean) {
    if (forDelete) {
      setDeleteId(String(id).split("-")[1]);
      return onOpenDeleteTaskModal();
    }
    setTaskId(String(id).split("-")[1]);
    onOpen();
  }

  async function onRemoveTask() {
    if (!deleteTaskId) return;
    deleteTask(deleteTaskId).then(() => {
      toast.success("Delete Success 🥲");
      mutateProject();
      onCloseDeleteTaskModal();
      setDeleteId("");
    });
  }
  function onEditTask() {
    if (!taskId) return;

    editTask(taskId, {
      name: editTaskName,
      description: editTaskDescription,
      deadline: new Date(deadline),
    }).then(() => {
      toast.success("Task Edit Success");
      mutateProject();
      onClose();
      setTaskId("");
      setDeadline("");
    });
  }

  useEffect(() => {
    if (data) {
      setEditTaskName(data.name);
      setEditTaskDescription(data.description || "");
      if (data.deadline)
        setDeadline(format(new Date(data.deadline), "yyyy-MM-dd"));
      else setDeadline("");
    }
  }, [data]);

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

  useEffect(() => {
    const oneMinute = 2 * 1000 * 60; // milliseconds = 5 minute
    const interval = setInterval(() => {
      onSave();
    }, oneMinute);

    return () => clearInterval(interval);
  }, [onSave]);

  return isLoading ? (
    <main className="container mx-auto w-full flex justify-center">
      <Spinner size="lg" className="mt-20" />
    </main>
  ) : (
    <div className="container mx-auto py-5">
      <Button
        className="fixed bottom-10 right-10"
        isIconOnly
        variant="shadow"
        color="primary"
        onClick={() => onSave()}
      >
        <ArrowDownTrayIcon className="h-6 w-6" />
      </Button>
      <Modal backdrop={"blur"} isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(onClose) =>
            singleItemLoading && !data ? (
              <div className="w-full flex justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Edit ( {editTaskName} )
                </ModalHeader>
                <ModalBody>
                  <Input
                    label="Task Name"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (!editTaskName) return;
                        trigger();
                      }
                    }}
                  />
                  <Textarea
                    label="Task Description ..."
                    value={editTaskDescription}
                    onChange={(e) => setEditTaskDescription(e.target.value)}
                  />
                  <p>Deadline</p>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />

                  <p>Create At : {data?.createdAt.toDateString()}</p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onClick={() => {
                      setDeadline("");
                      onClose();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onClick={() => {
                      if (!editTaskName) return;
                      trigger();
                    }}
                    isLoading={updateTaskLoading}
                  >
                    Save
                  </Button>
                </ModalFooter>
              </>
            )
          }
        </ModalContent>
      </Modal>

      {/* Add Container Modal */}
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
                  }}
                >
                  Add
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* Add Item Modal */}
      <Modal isOpen={isAddTaskModalOpen} onOpenChange={onOpenChangeTaskModal}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Add Task
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col w-full items-start gap-y-4">
                  <Input
                    type="text"
                    placeholder="Task Title"
                    name="itemname"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onAddTask();
                      }
                    }}
                  />
                  <p>Deadline</p>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  isDisabled={editProjectLoading}
                  isLoading={editProjectLoading}
                  onClick={() => {
                    onAddTask();
                  }}
                >
                  Add
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isDeleteTaskModalOpen}
        onOpenChange={onDeleteOpenChangeTaskModal}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Delete Task
              </ModalHeader>
              <ModalBody>Are you sure you want to delete this task ?</ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  isDisabled={deleteTaskLoading}
                  isLoading={deleteTaskLoading}
                  onClick={() => {
                    onDeleteTask();
                  }}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="flex items-center justify-between gap-y-2">
        <h1 className="text-xl ">Task Management</h1>
        <Button
          onClick={onOpenContainerModal}
          color="primary"
          endContent={<PlusIcon className="w-5 h-5" />}
          variant="shadow"
        >
          Add Container
        </Button>
      </div>
      <div className="mt-10">
        <div className="grid  md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={containers.map((i) => i.id)}>
              {containers.map((container) => (
                <Container
                  id={container.id}
                  title={container.title}
                  key={container.id}
                  onAddItem={() => {
                    onOpenAddTaskModal();
                    setCurrentContainerId(container.id);
                  }}
                  edit={edit}
                  setEdit={setEdit}
                  setIsSaved={setIsSaved}
                >
                  <SortableContext items={container.items.map((i) => i.id)}>
                    <div className="flex items-start flex-col gap-y-4">
                      {container.items.map((i) => (
                        <Items
                          title={i.name}
                          id={i.id}
                          key={i.id}
                          onActiveItem={onActiveItem}
                          onOpenDeleteTaskModal={onOpenDeleteTaskModal}
                          deadline={i.deadline || undefined}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </Container>
              ))}
            </SortableContext>
            <DragOverlay adjustScale={false}>
              {activeId && activeId.toString().includes("item") && (
                <Items
                  id={activeId}
                  title={findItemById(activeId)!.name}
                  deadline={findItemById(activeId)!.deadline || undefined}
                />
              )}
              {activeId && activeId.toString().includes("container") && (
                <Container id={activeId} title={findContainerTitle(activeId)}>
                  {findContainerItems(activeId).map((i) => (
                    <Items
                      key={i.id}
                      title={i.name}
                      id={i.id}
                      deadline={i.deadline || undefined}
                    />
                  ))}
                </Container>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
