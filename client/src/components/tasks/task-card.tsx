import { Task } from "@shared/schema";
import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trophy,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Coins
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  isParent: boolean;
}

export function TaskCard({ task, isParent }: TaskCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [editedReward, setEditedReward] = useState(task.reward);
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate);

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      const res = await apiRequest("PATCH", `/api/tasks/${task.id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "The task has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully",
      });
    },
  });

  const handleComplete = () => {
    updateTaskMutation.mutate({ completed: true });
  };

  const handleValidate = () => {
    updateTaskMutation.mutate({ validated: true });
  };

  const handleReject = () => {
    updateTaskMutation.mutate({ completed: false });
  };

  const handleDelete = () => {
    deleteTaskMutation.mutate();
  };

  const handleEdit = () => {
    updateTaskMutation.mutate({
      title: editedTitle,
      description: editedDescription,
      reward: editedReward,
      dueDate: editedDueDate
    });
    setIsEditing(false);
  };

  const isPending = updateTaskMutation.isPending || deleteTaskMutation.isPending;

  return (
    <Card className="relative overflow-hidden">
      {task.validated && (
        <div className="absolute top-0 right-0 p-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
        </div>
      )}
      
      <CardHeader className="bg-gradient-to-r from-blue-100 to-green-100 rounded-t-lg">
        <div className="flex justify-between items-start">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="font-semibold text-lg mb-2"
            />
          ) : (
            <h3 className="font-semibold text-lg">{task.title}</h3>
          )}
          <div className="flex items-center text-yellow-500">
            <Coins className="h-4 w-4 mr-1" />
            {isEditing ? (
              <Input
                type="number"
                value={editedReward}
                onChange={(e) => setEditedReward(Number(e.target.value))}
                className="w-20"
              />
            ) : (
              <span>{task.reward}</span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <p className="text-muted-foreground">{task.description}</p>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-1" />
          {isEditing ? (
            <Input
              type="date"
              value={editedDueDate ? new Date(editedDueDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setEditedDueDate(e.target.value ? new Date(e.target.value) : null)}
              className="w-40"
            />
          ) : (
            task.dueDate && <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isParent ? (
          <>
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            {task.completed && !task.validated && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={handleValidate}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Validate
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        ) : (
          !task.completed && !task.validated && (
            <Button
              size="sm"
              onClick={handleComplete}
            >
              Complete Task
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
}
