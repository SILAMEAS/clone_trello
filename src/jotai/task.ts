import { ArrowDownTrayIcon } from '@heroicons/react/16/solid';
import { Task } from "@prisma/client";
import { atom } from "jotai";

export type TaskPatial = Partial<Task> & {
    id: string
    name: string
}

export type TaskType = {
    id: string
    title: string
    items: TaskPatial[]
}

export const containerAtom = atom<TaskType[]>([]);
