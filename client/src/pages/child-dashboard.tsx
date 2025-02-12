import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";
import { LogOut, Coins } from "lucide-react";
import { type Task } from "@shared/schema";

export default function ChildDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-yellow-500">
              <Coins className="mr-2 h-5 w-5" />
              <span className="font-semibold">{user?.coins || 0}</span>
            </div>
            <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <TaskList tasks={tasks} isParent={false} />
        </div>
      </main>
    </div>
  );
}