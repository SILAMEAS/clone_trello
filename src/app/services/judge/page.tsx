"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Textarea,
} from "@nextui-org/react";
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
import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { addProject, deleteProject, getProjects } from "./action";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";
import { redirect, useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { defaultRootContainer, judgeAtom } from "@/jotai/judge";
import { toast } from "sonner";

type Props = {};

const Judge = (props: Props) => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useKindeBrowserClient();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string>("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const setContainers = useSetAtom(judgeAtom);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const { isMutating, trigger } = useSWRMutation("projects", onAddProject);
  const { isMutating: isDeleteMutating, trigger: deleteTrigger } =
    useSWRMutation("projects", onDeleteProject);
  const { data: projects, isLoading } = useSWR(
    user?.id ? "projects" : null,
    getAllProjects
  );

  async function getAllProjects() {
    if (user) {
      return getProjects(user.id);
    }
  }

  function onDeleteProject() {
    if (!user) return;
    return deleteProject(deleteId);
  }

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

  useEffect(() => {
    // reset state to default
    setContainers([defaultRootContainer]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
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
          <h2 className="mt-5 text-xl">Your Projects 😀</h2>
          <Button
            onClick={onOpen}
            color="primary"
            endContent={<PlusIcon className="h-6 w-6" />}
            variant="shadow"
          >
            Create Project
          </Button>
        </div>
        <div className="flex items-center justify-center">
          {isLoading ? (
            <Spinner className="mt-20" />
          ) : projects?.length === 0 ? (
            <p className="mt-20 text-xl">No projects yet 🥲</p>
          ) : null}
        </div>
        <div className="mt-10 gap-10 grid md:grid-cols-2 xl:grid-cols-4">
          {projects &&
            projects.map((project, index) => (
              <div
                key={index}
                onClick={() => {
                  router.push(`/services/judge/${project.id}`);
                }}
              >
                <Card
                  radius="lg"
                  className="p-5 h-60 cursor-pointer border shadow-lg hover:scale-95"
                >
                  <CardHeader className="text-xl flex justify-between items-center font-semibold">
                    {project.name}
                    <Button
                      isIconOnly
                      color="danger"
                      variant="shadow"
                      size="sm"
                      onClick={() => {
                        onDeleteOpen();
                        setDeleteId(project.id);
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardBody className="text-default-500">
                    {project.description}
                  </CardBody>
                </Card>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default Judge;
