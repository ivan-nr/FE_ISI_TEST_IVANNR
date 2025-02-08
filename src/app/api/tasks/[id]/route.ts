import { NextResponse } from "next/server";
import { PrismaClient, Status } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

async function authenticateUser(request: Request) {
  const token = request.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticateUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      changes: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Received update data:", body);

    const { title, description, status, assignedToId } = body;

    // Validasi status
    if (status && !Object.values(Status).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (user.role !== "LEAD" && user.userId !== task.assignedToId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Persiapkan data update
    const updateData: Partial<{
      title: string;
      description: string | null;
      status: Status;
      assignedToId: string;
    }> = {};

    if (user.role === "LEAD") {
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (assignedToId) {
        // Validasi assignedToId exists
        const assignedUser = await prisma.user.findUnique({
          where: { id: assignedToId },
        });
        if (!assignedUser) {
          return NextResponse.json(
            { error: "Assigned user not found" },
            { status: 404 }
          );
        }
        updateData.assignedToId = assignedToId;
      }
    }

    if (status) {
      updateData.status = status;
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      {
        error: "Failed to update task",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
