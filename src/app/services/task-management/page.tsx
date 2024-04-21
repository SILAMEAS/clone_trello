"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
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
import Link from "next/link";
import useSWR from "swr";
import { addProject, deleteProject, getProjects } from "./action";
import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import useSWRMutation from "swr/mutation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {};

const TaskProjectList = (props: Props) => {
  // state
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string>("");

  // hook
  const { user } = useKindeBrowserClient();
  const { data, isLoading } = useSWR(
    user?.id ? "task-project" : null,
    getAllProjects
  );
  const { isMutating: isDeleteMutating, trigger: deleteTrigger } =
    useSWRMutation("task-project", onDeleteProject);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const router = useRouter();

  async function getAllProjects() {
    if (user) {
      return getProjects(user.id);
    }
  }

  function onDeleteProject() {
    if (!user) return;
    return deleteProject(deleteId);
  }

  const { isMutating, trigger } = useSWRMutation("task-project", onAddProject);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  function onAddProject() {
    if (!name || !user) return;
    if (name.length > 10) {
      toast.error("Project name is too long 🤨");
      return;
    }
    if (description.length > 100) {
      toast.error("Project description is too long 🤨");
      return;
    }
    return addProject({
      name,
      description,
      userId: user.id,
    });
  }

  return (
    <div className="container">
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Create Project
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col w-full items-start gap-y-4">
                  <Input
                    type="text"
                    placeholder="Project name ..."
                    name="Project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        trigger().then(() => {
                          setName("");
                          setDescription("");
                          onClose();
                        });
                      }
                    }}
                  />
                  <Textarea
                    type="text"
                    placeholder="Description ..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  disabled={isMutating}
                  onClick={() => {
                    trigger().then(() => {
                      setName("");
                      setDescription("");
                      onClose();
                    });
                  }}
                  isLoading={isMutating}
                >
                  Create
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Delete Project
              </ModalHeader>
              <ModalBody>
                <p>Are you sure you want to delete this project?</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Close
                </Button>
                <Button
                  color="danger"
                  disabled={isDeleteMutating}
                  onClick={() => {
                    deleteTrigger().then(() => {
                      onClose();
                    });
                  }}
                  isLoading={isDeleteMutating}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="flex items-center justify-between">
        <h2 className="mt-5 text-xl ">Your Projects 😀</h2>
        <Button
          onClick={onOpen}
          color="primary"
          endContent={<PlusIcon className="h-6 w-6" />}
          variant="shadow"
        >
          Create Project
        </Button>
      </div>
      {isLoading && (
        <div className="w-full flex justify-center">
          <Spinner className="mt-5" size="lg" />
        </div>
      )}
      {!isLoading && data && data.length === 0 && (
        <div className="w-full flex justify-center">
          <p className="mt-20 text-xl">
            You don&apos;t have any projects yet 🥹
          </p>
        </div>
      )}
      {data && (
        <div className="mt-10 gap-10 grid md:grid-cols-2 xl:grid-cols-4">
          {data.map((taskProject, index) => (
            <div
              key={index}
              onClick={() => {
                router.push(`/services/task-management/${taskProject.id}`);
              }}
            >
              <Card
                radius="lg"
                className="p-5 h-60 cursor-pointer border shadow-lg hover:scale-95"
              >
                <CardHeader className="text-xl flex justify-between items-center font-semibold">
                  {taskProject.name}
                  <Button
                    isIconOnly
                    color="danger"
                    variant="shadow"
                    size="sm"
                    onClick={() => {
                      onDeleteOpen();
                      setDeleteId(taskProject.id);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardBody className="text-default-500">
                  {taskProject.description}
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskProjectList;
