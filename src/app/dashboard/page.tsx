"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskList from "../components/TaskList";
import TaskForm from "../components/TaskForm";

export default function Dashboard() {
  interface User {
    name: string;
    role: "LEAD" | "TEAM";
  }

  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tasks");
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      if (error instanceof Error && error.message === "Unauthorized") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">
                  Todo List App
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {user.role === "LEAD" && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
            <TaskForm onTaskCreated={fetchTasks} />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold mb-4">Tasks</h2>
          <TaskList
            tasks={tasks}
            onTaskUpdated={fetchTasks}
            userRole={user.role}
          />
        </div>
      </main>
    </div>
  );
}
