"use client";

import { useState } from "react";
import type { Status } from "@prisma/client";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "REJECT";
  createdBy: { name: string };
  assignedTo: { name: string } | null;
}

interface TaskListProps {
  tasks: Task[];
  onTaskUpdated: () => void;
  userRole: "LEAD" | "TEAM";
}

export default function TaskList({
  tasks,
  onTaskUpdated,
  userRole,
}: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleStatusChange = async (taskId: string, newStatus: Status) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      onTaskUpdated();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleSave = async () => {
    if (!editingTask) return;

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editingTask),
      });
      if (!response.ok) throw new Error("Failed to update task");
      setEditingTask(null);
      onTaskUpdated();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {tasks.map((task) => (
          <li key={task.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">
                  {task.title}
                </p>
                <div className="ml-2 flex-shrink-0 flex">
                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {task.status}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500">
                    {task.description}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <p>Assigned to: {task.assignedTo?.name}</p>
                </div>
              </div>
              {editingTask?.id === task.id ? (
                <div className="mt-4">
                  <input
                    type="text"
                    disabled={userRole === "TEAM"}
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <textarea
                    value={editingTask.description || ""}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                    className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={handleSave}
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  {
                    <button
                      onClick={() => handleEdit(task)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mr-2"
                    >
                      Edit
                    </button>
                  }
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value as Status)
                    }
                    className="block w-full py-2 mt-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ON_PROGRESS">On Progress</option>
                    <option value="DONE">Done</option>
                    <option value="REJECT">Reject</option>
                  </select>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
