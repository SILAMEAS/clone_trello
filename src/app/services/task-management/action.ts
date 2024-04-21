"use server"

import prisma from "@/app/lib/prisma";
import { TaskType } from "@/jotai/task";
import { Prisma } from "@prisma/client";

export async function getProjects(userId: string) {
    return await prisma.taskProject.findMany({
        where: {
            userId
        },
    })
}

export async function editProject(id: string, containers: TaskType[]) {
    const allContainer = await prisma.taskContainer.findMany({
        where: {
            projectId: id
        }
    })

    await prisma.task.deleteMany({
        where: {
            containerId: {
                in: allContainer.map((c) => c.id)
            }
        }
    })

    await prisma.taskContainer.deleteMany({
        where: {
            projectId: id
        }
    })


    return await Promise.all(containers.map(async (container, index) => {
        await prisma.taskContainer.create({
            data: {
                index,
                title: container.title,
                projectId: id,
                tasks: {
                    create: container.items.map((item) => ({ ...item, id: undefined }))
                }
            },
        })
    }))

}

export async function addProject(data: {
    name: string,
    description: string,
    userId: string,
}) {
    return await prisma.taskProject.create({ data })
}

export async function deleteProject(id: string) {
    await prisma.taskContainer.deleteMany({
        where: {
            projectId: id
        }
    })
    return await prisma.taskProject.delete({ where: { id } })
}

export async function getProject(id: string) {
    return await prisma.taskProject.findUnique({
        where: {
            id
        },
        include: {
            containers: {
                orderBy: {
                    index: "asc",
                },
                include: {
                    tasks: true,
                }
            }
        }
    })
}

export async function onEditContainer(id: string, title: string) {
    return await prisma.taskContainer.update({
        where: {
            id
        },
        data: {
            title
        }
    })
}

export async function getTask(id: string) {

    return await prisma.task.findUnique({
        where: {
            id
        }
    })
}

export async function editTask(id: string, data: Prisma.TaskUpdateInput) {


    const task = await prisma.task.findUnique({
        where: {
            id
        }
    })

    if (task) {
        return await prisma.task.update({
            where: {
                id
            },
            data
        })
    }


}

export async function deleteTask(id: string) {

    return await prisma.task.delete({
        where: {
            id
        }
    })
}