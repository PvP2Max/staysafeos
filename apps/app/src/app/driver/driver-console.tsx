"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@staysafeos/ui";
import Link from "next/link";

interface Van {
  id: string;
  name: string;
  capacity: number;
  status: string;
}

interface Task {
  id: string;
  type: string;
  address: string;
  notes?: string;
  sortOrder: number;
  ride?: {
    id: string;
    riderName: string;
    riderPhone: string;
    passengerCount: number;
  };
}

interface DriverConsoleProps {
  initialVans: Van[];
  initialStatus: {
    online: boolean;
    van: { id: string; name: string } | null;
    role: string;
  };
  initialTasks: Task[];
}

export function DriverConsole({
  initialVans,
  initialStatus,
  initialTasks,
}: DriverConsoleProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedVan, setSelectedVan] = useState("");
  const [message, setMessage] = useState("");

  const handleGoOnline = () => {
    if (!selectedVan) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/driver/go-online", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vanId: selectedVan }),
        });

        if (!response.ok) throw new Error("Failed to go online");

        const van = initialVans.find((v) => v.id === selectedVan);
        setStatus({ online: true, van: van ? { id: van.id, name: van.name } : null, role: status.role });
        setMessage("You are now online!");
      } catch {
        setMessage("Failed to go online. Please try again.");
      }
    });
  };

  const handleGoOffline = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/driver/go-offline", {
          method: "POST",
        });

        if (!response.ok) throw new Error("Failed to go offline");

        setStatus({ online: false, van: null, role: status.role });
        setTasks([]);
        setMessage("You are now offline.");
      } catch {
        setMessage("Failed to go offline. Please try again.");
      }
    });
  };

  const handleCompleteTask = (taskId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/driver/tasks/${taskId}/complete`, {
          method: "POST",
        });

        if (!response.ok) throw new Error("Failed to complete task");

        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setMessage("Task completed!");
      } catch {
        setMessage("Failed to complete task.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            StaySafeOS
          </Link>
          <Badge className={status.online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {status.online ? "Online" : "Offline"}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Console</h1>
          <p className="text-muted-foreground mt-1">
            {status.van ? `Van: ${status.van.name}` : "Select a van to go online"}
          </p>
        </div>

        {message && (
          <p className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        {/* Online/Offline Controls */}
        {!status.online ? (
          <Card>
            <CardHeader>
              <CardTitle>Go Online</CardTitle>
              <CardDescription>Select a van to start your shift</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedVan} onValueChange={setSelectedVan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a van..." />
                </SelectTrigger>
                <SelectContent>
                  {initialVans.map((van) => (
                    <SelectItem key={van.id} value={van.id}>
                      {van.name} (Capacity: {van.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGoOnline}
                disabled={!selectedVan || isPending}
                className="w-full"
                size="lg"
              >
                {isPending ? "Going Online..." : "Go Online"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Task List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks ({tasks.length})</CardTitle>
                <CardDescription>Complete tasks in order</CardDescription>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks assigned</p>
                    <p className="text-sm mt-1">Waiting for dispatch...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index + 1}
                          onComplete={() => handleCompleteTask(task.id)}
                          isPending={isPending}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/driver/walkon">
                <Card className="hover:border-primary cursor-pointer transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Walk-On Ride</CardTitle>
                    <CardDescription>Create a ride for someone who approached the van</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/driver/transfers">
                <Card className="hover:border-primary cursor-pointer transition-colors h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Transfers</CardTitle>
                    <CardDescription>Request or accept a TC transfer</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>

            {/* Go Offline */}
            <Button
              variant="destructive"
              onClick={handleGoOffline}
              disabled={isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? "Going Offline..." : "Go Offline"}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}

function TaskCard({
  task,
  index,
  onComplete,
  isPending,
}: {
  task: Task;
  index: number;
  onComplete: () => void;
  isPending: boolean;
}) {
  const typeColors: Record<string, string> = {
    PICKUP: "bg-blue-100 text-blue-800",
    DROPOFF: "bg-green-100 text-green-800",
    CUSTOM: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
            {index}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge className={typeColors[task.type] || "bg-gray-100"}>{task.type}</Badge>
              {task.ride && (
                <span className="text-sm font-medium">{task.ride.riderName}</span>
              )}
            </div>
            <p className="text-sm mt-1">{task.address}</p>
            {task.ride && (
              <p className="text-xs text-muted-foreground mt-1">
                {task.ride.passengerCount} passenger{task.ride.passengerCount !== 1 ? "s" : ""} · {task.ride.riderPhone}
              </p>
            )}
            {task.notes && (
              <p className="text-sm text-muted-foreground mt-2">Note: {task.notes}</p>
            )}
          </div>
        </div>
        <Button onClick={onComplete} disabled={isPending} size="sm">
          Complete
        </Button>
      </div>
    </div>
  );
}
