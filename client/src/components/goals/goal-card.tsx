import { Goal } from "@shared/schema";
import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trophy,
  CheckCircle2,
  Calendar,
  Coins,
  Target
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface GoalCardProps {
  goal: Goal;
  isParent: boolean;
}

export function GoalCard({ goal, isParent }: GoalCardProps) {
  const { toast } = useToast();

  const updateGoalMutation = useMutation({
    mutationFn: async (updates: Partial<Goal>) => {
      const res = await apiRequest("PATCH", `/api/goals/${goal.id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Goal updated",
        description: "The goal has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/goals/${goal.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Goal deleted",
        description: "The goal has been deleted successfully",
      });
    },
  });

  const handleValidate = () => {
    updateGoalMutation.mutate({ validated: true });
  };

  const handleDelete = () => {
    deleteGoalMutation.mutate();
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title);
  const [editedDescription, setEditedDescription] = useState(goal.description);
  const [editedObjective, setEditedObjective] = useState(goal.objective);
  const [editedReward, setEditedReward] = useState(goal.reward);
  const [editedTargetTasks, setEditedTargetTasks] = useState(goal.targetTasks);


  const handleEdit = () => {
    updateGoalMutation.mutate({
      title: editedTitle,
      description: editedDescription,
      objective: editedObjective,
      targetTasks: editedTargetTasks,
      reward: editedReward
    });
    setIsEditing(false);
  };

  const progress = ((goal.completedTasks ?? 0) / goal.targetTasks) * 100;

  return (
    <Card className="relative overflow-hidden">
      {goal.validated && (
        <div className="absolute top-0 right-0 p-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
        </div>
      )}

      <CardHeader className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="font-semibold text-lg mb-2"
              />
            ) : (
              <h3 className="font-semibold text-lg">{goal.title}</h3>
            )}
            <p className="text-sm text-muted-foreground capitalize">{goal.type} Goal</p>
          </div>
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
                <span>{goal.reward}</span>
              )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {isEditing ? (
            <Input
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="mb-2"
              textarea
            />
          ) : (
            <p className="text-muted-foreground">{goal.description}</p>
          )}
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-medium mb-1">Objective</h4>
            {isEditing ? (
              <Input
                value={editedObjective}
                onChange={(e) => setEditedObjective(e.target.value)}
                className="mb-2"
                textarea
              />
            ) : (
              <p className="text-sm text-muted-foreground">{goal.objective}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            {isEditing ? (
              <Input
                type="number"
                value={editedTargetTasks}
                onChange={(e) => setEditedTargetTasks(parseInt(e.target.value, 10))}
                className="w-20"
              />
            ) : (
              <span className="font-medium">{goal.completedTasks}/{goal.targetTasks} tasks</span>
            )}
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{format(new Date(goal.startDate), "MMM d")}</span>
          </div>
          <span>→</span>
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-1" />
            <span>{format(new Date(goal.endDate), "MMM d")}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        {isParent ? (
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
            {goal.completed && !goal.validated && (
              <Button
                size="sm"
                onClick={handleValidate}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Validate
              </Button>
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
          <div className="text-sm font-medium">
            {goal.completed ? (
              goal.validated ? (
                <span className="text-green-600">Completed and validated!</span>
              ) : (
                <span className="text-yellow-600">Waiting for validation</span>
              )
            ) : (
              <span>Keep going!</span>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}