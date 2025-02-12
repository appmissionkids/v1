import { Goal } from "@shared/schema";
import { GoalCard } from "./goal-card";

interface GoalListProps {
  goals: Goal[];
  isParent: boolean;
}

export function GoalList({ goals, isParent }: GoalListProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center p-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">No goals found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} isParent={isParent} />
      ))}
    </div>
  );
}
