"use server"

import prisma from "@/app/lib/prisma"
import { Judge } from "@/jotai/judge"

export async function getProjects(userId: string) {
    return await prisma.judgeProject.findMany({
        where: {
            userId
        }
    })
}
export async function getProject(id: string) {
    return await prisma.judgeProject.findUnique({
        where: {
            id
        },
        include: {
            containers: true
        }
    })
}
export async function addProject(data: {
    name: string,
    description: string,
    userId: string,
}) {
    return await prisma.judgeProject.create({ data })
}

export async function deleteProject(id: string) {

    const allContainer = await prisma.judgeContainer.findMany({
        where: {
            projectId: id
        },
        select: {
            items: true,
            id: true
        }
    })

    // remove image from container
    await deleteImage(allContainer.flatMap((c) => c.items))
    await prisma.judgeContainer.deleteMany({
        where: {
            projectId: id
        }
    })
    return await prisma.judgeProject.delete({ where: { id } })
}

export async function editProject(id: string, containers: Judge[]) {
    const data = containers.map((container) => {
        return {
            title: container.title,
            items: container.items.map((item) => item.image)
        }
    })

    const allContainer = await prisma.judgeContainer.findMany({
        where: {
            projectId: id
        },
        select: {
            items: true,
            id: true
        }
    })

    // remove image from old miss container
    const allNewContanerIds = containers.map((container) => container.id)
    for (const c of allContainer) {
        if (!allNewContanerIds.includes(c.id)) {
            await deleteImage(c.items).catch((e) => console.error(e))
        }
    }
    await prisma.judgeContainer.deleteMany({
        where: {
            projectId: id
        }
    })
    return await prisma.judgeProject.update({
        where: {
            id
        },
        data: {
            containers: { create: data }
        }
    })
}

export async function deleteImage(image: string | string[]) {
    const url = process.env.KINDE_SITE_URL! + "/api/uploadthing";

    const options = {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(image)
    };

    return await fetch(url, options)
        .then(response => {
            return response.json();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

export async function onEditContainer(id: string, title: string) {
    return await prisma.judgeContainer.update({
        where: {
            id
        },
        data: {
            title
        }
    })
}