import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
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

export async function GET(request: Request) {
  const user = await authenticateUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
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

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const user = await authenticateUser(request);

  if (!user || user.role !== "LEAD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, assignedToId } = await request.json();

    if (!title || !assignedToId) {
      return NextResponse.json(
        { error: "Title and assignedToId are required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedTo: { connect: { id: assignedToId } },
        createdBy: { connect: { id: user.userId } },
      },
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

    // await prisma.change.create({
    //   data: {
    //     taskId: task.id,
    //     field: "status",
    //     oldValue: null,
    //     newValue: "NOT_STARTED",
    //   },
    // });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      {
        error: "Failed to create task",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
