import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TaskList } from "@/components/tasks/task-list";
import { GoalList } from "@/components/goals/goal-list";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, insertGoalSchema, type User, type Task, type Goal, type InsertTask, type InsertGoal } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ParentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const { data: children = [], isLoading: isLoadingChildren } = useQuery<User[]>({
    queryKey: ["/api/children"],
    enabled: user?.role === "parent",
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const taskForm = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      reward: 10,
      childId: undefined,
      dueDate: null,
      goalId: undefined, // Added goalId
    },
  });

  const goalForm = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "weekly",
      reward: 50,
      childId: undefined,
      targetTasks: 5,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      objective: "", //Added objective
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      if (!data.childId) {
        throw new Error("Please select a child");
      }
      const res = await apiRequest("POST", "/api/tasks", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "The task has been created successfully",
      });
      taskForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: InsertGoal) => {
      if (!data.childId) {
        throw new Error("Please select a child");
      }
      const res = await apiRequest("POST", "/api/goals", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Goal created",
        description: "The goal has been created successfully",
      });
      goalForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Parent Dashboard</h1>
          <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tasks" className="space-y-8">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>

            <div className="space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-gradient-to-r from-pink-200 to-purple-200 hover:from-pink-300 hover:to-purple-300">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Child
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manage Child Account</DialogTitle>
                    <DialogDescription>
                      Create or edit your child's account to track their tasks and goals.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="register">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="register">Register</TabsTrigger>
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                    </TabsList>
                    <TabsContent value="register">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const data = {
                            username: formData.get('username') as string,
                            password: formData.get('password') as string,
                            role: 'child',
                            parentUsername: user?.username
                          };

                          fetch('/api/register', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data)
                          }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/children'] });
                            toast({
                              title: "Child account created",
                              description: "The child account has been created successfully"
                            });
                            (e.target as HTMLFormElement).reset();
                          }).catch(error => {
                            toast({
                              title: "Failed to create child account",
                              description: error.message,
                              variant: "destructive"
                            });
                          });
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" name="username" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" name="password" type="password" required />
                        </div>
                        <Button type="submit">Register Child</Button>
                      </form>
                    </TabsContent>
                    <TabsContent value="edit">
                      <div className="space-y-4">
                        {children.map((child) => (
                          <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-pink-50 to-purple-50">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium mb-1">{child.username}</p>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newUsername = prompt("Enter new username for " + child.username);
                                      if (newUsername) {
                                        fetch(`/api/users/${child.id}`, {
                                          method: 'PATCH',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({ username: newUsername })
                                        })
                                        .then(() => {
                                          queryClient.invalidateQueries({ queryKey: ['/api/children'] });
                                          toast({
                                            title: "Username updated",
                                            description: "Child's username has been updated successfully"
                                          });
                                        })
                                        .catch(error => {
                                          toast({
                                            title: "Failed to update username",
                                            description: error.message,
                                            variant: "destructive"
                                          });
                                        });
                                      }
                                    }}
                                  >
                                    Edit Username
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newPassword = prompt("Enter new password for " + child.username);
                                      if (newPassword) {
                                        fetch(`/api/users/${child.id}`, {
                                          method: 'PATCH',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({ password: newPassword })
                                        })
                                        .then(() => {
                                          toast({
                                            title: "Password updated",
                                            description: "Child's password has been updated successfully"
                                          });
                                        })
                                        .catch(error => {
                                          toast({
                                            title: "Failed to update password",
                                            description: error.message,
                                            variant: "destructive"
                                          });
                                        });
                                      }
                                    }}
                                  >
                                    Change Password
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this child account?")) {
                                  try {
                                    await fetch(`/api/users/${child.id}`, {
                                      method: 'DELETE',
                                    });
                                    queryClient.invalidateQueries({ queryKey: ['/api/children'] });
                                    toast({
                                      title: "Child account deleted",
                                      description: "The child account has been deleted successfully"
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Failed to delete child account",
                                      description: error.message,
                                      variant: "destructive"
                                    });
                                  }
                                }
                              }}
                            >
                              Delete Account
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Create a new task by filling out the form below.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...taskForm} id="task-form">
                    <form
                      onSubmit={taskForm.handleSubmit((data) => createTaskMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={taskForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taskForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taskForm.control}
                        name="reward"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reward (coins)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taskForm.control}
                        name="childId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign to Child</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a child" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {children.map((child) => (
                                  <SelectItem key={child.id} value={child.id.toString()}>
                                    {child.username}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={taskForm.control}
                        name="goalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link to Goal (Optional)</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                              value={field.value?.toString() || "none"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a goal (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No goal</SelectItem>
                                {goals
                                  .filter(goal => !goal.completed && !goal.validated)
                                  .map((goal) => (
                                    <SelectItem key={goal.id} value={goal.id.toString()}>
                                      {goal.title}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={createTaskMutation.isPending || isLoadingChildren || children.length === 0}
                      >
                        {children.length === 0 ? "No children available" : "Create Task"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Goal</DialogTitle>
                    <DialogDescription>
                      Create a new goal by filling out the form below.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...goalForm} id="goal-form">
                    <form
                      onSubmit={goalForm.handleSubmit((data) => createGoalMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={goalForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={goalForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={goalForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select goal type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={goalForm.control}
                        name="reward"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reward (coins)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={goalForm.control}
                        name="targetTasks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Tasks</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={goalForm.control}
                        name="objective"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Goal Objective</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="What should your child achieve with this goal? E.g., Complete homework every day this week"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={goalForm.control}
                          name="startDate"
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={value}
                                  onChange={onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={goalForm.control}
                          name="endDate"
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={value}
                                  onChange={onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={goalForm.control}
                        name="childId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign to Child</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a child" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {children.map((child) => (
                                  <SelectItem key={child.id} value={child.id.toString()}>
                                    {child.username}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={createGoalMutation.isPending || isLoadingChildren || children.length === 0}
                      >
                        {children.length === 0 ? "No children available" : "Create Goal"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="tasks" className="space-y-6">
            <TaskList tasks={tasks} isParent={true} />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <GoalList goals={goals} isParent={true} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}