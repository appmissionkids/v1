import { Task } from "@shared/schema";
import { TaskCard } from "./task-card";

interface TaskListProps {
  tasks: Task[];
  isParent: boolean;
}

export function TaskList({ tasks, isParent }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center p-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} isParent={isParent} />
      ))}
    </div>
  );
}
