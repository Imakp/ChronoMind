"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  createGoal,
  createTask,
  createSubTask,
  toggleSubTask,
  deleteGoal,
  deleteTask,
  deleteSubTask,
  updateGoal,
  updateTask,
} from "@/lib/actions";
import type {
  GoalWithRelations,
  TaskWithRelations,
  SubTaskWithRelations,
} from "@/types";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface YearlyGoalsProps {
  yearId: string;
  year: number;
  initialGoals: GoalWithRelations[];
}

export function YearlyGoals({ yearId, year, initialGoals }: YearlyGoalsProps) {
  const [goals, setGoals] = useState<GoalWithRelations[]>(initialGoals);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [, startTransition] = useTransition(); // We use this for the background server action
  const router = useRouter();

  // Sync with server data when it eventually arrives
  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  // --- Optimistic Helpers ---

  const calculateGoalPercentage = (tasks: TaskWithRelations[]) => {
    if (tasks.length === 0) return 0;
    const total = tasks.reduce((sum, task) => sum + task.percentage, 0);
    return total / tasks.length;
  };

  const calculateTaskPercentage = (subtasks: SubTaskWithRelations[]) => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter((s) => s.isComplete).length;
    return (completed / subtasks.length) * 100;
  };

  // --- Handlers ---

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) return;

    const tempId = `temp-goal-${Date.now()}`;
    const optimisticGoal: GoalWithRelations = {
      id: tempId,
      title: newGoalTitle,
      yearId,
      description: null,
      percentage: 0,
      tasks: [],
      highlights: [],
    };

    // 1. Optimistic Update
    setGoals((prev) => [...prev, optimisticGoal]);
    setNewGoalTitle("");
    setIsAddingGoal(false);

    // 2. Server Action
    startTransition(async () => {
      try {
        const result = await createGoal(yearId, optimisticGoal.title);
        if (result.success && result.data) {
          // Replace temp goal with real goal to get valid ID
          setGoals((prev) =>
            prev.map((g) =>
              g.id === tempId ? (result.data as GoalWithRelations) : g
            )
          );
          router.refresh();
          toast.success("Goal created");
        } else {
          // Revert on failure
          setGoals((prev) => prev.filter((g) => g.id !== tempId));
          toast.error("Failed to create goal");
        }
      } catch {
        setGoals((prev) => prev.filter((g) => g.id !== tempId));
        toast.error("Error creating goal");
      }
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    const previousGoals = goals;
    // 1. Optimistic Update
    setGoals((prev) => prev.filter((g) => g.id !== goalId));

    // 2. Server Action
    startTransition(async () => {
      try {
        const result = await deleteGoal(goalId);
        if (result.success) {
          router.refresh();
        } else {
          setGoals(previousGoals);
          toast.error("Failed to delete goal");
        }
      } catch {
        setGoals(previousGoals);
        toast.error("Error deleting goal");
      }
    });
  };

  const handleUpdateGoal = (goalId: string, title: string) => {
    const previousGoals = goals;
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, title } : g))
    );

    startTransition(async () => {
      const result = await updateGoal(goalId, title);
      if (result.success) {
        router.refresh();
      } else {
        setGoals(previousGoals);
        toast.error("Failed to update goal");
      }
    });
  };

  // --- Task Handlers ---

  const handleCreateTask = async (goalId: string, title: string) => {
    const tempId = `temp-task-${Date.now()}`;
    const optimisticTask: TaskWithRelations = {
      id: tempId,
      title,
      goalId,
      description: null,
      percentage: 0,
      subtasks: [],
      highlights: [],
    };

    // 1. Optimistic Update
    const previousGoals = goals;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newTasks = [...g.tasks, optimisticTask];
          return {
            ...g,
            tasks: newTasks,
            percentage: calculateGoalPercentage(newTasks),
          };
        }
        return g;
      })
    );

    // 2. Server Action
    startTransition(async () => {
      try {
        const result = await createTask(goalId, title);
        if (result.success && result.data) {
          // Swap temp ID
          setGoals((prev) =>
            prev.map((g) => {
              if (g.id === goalId) {
                return {
                  ...g,
                  tasks: g.tasks.map((t) =>
                    t.id === tempId ? (result.data as TaskWithRelations) : t
                  ),
                };
              }
              return g;
            })
          );
          router.refresh();
        } else {
          setGoals(previousGoals);
          toast.error("Failed to create phase");
        }
      } catch {
        setGoals(previousGoals);
        toast.error("Error creating phase");
      }
    });
  };

  const handleDeleteTask = (goalId: string, taskId: string) => {
    const previousGoals = goals;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newTasks = g.tasks.filter((t) => t.id !== taskId);
          return {
            ...g,
            tasks: newTasks,
            percentage: calculateGoalPercentage(newTasks),
          };
        }
        return g;
      })
    );

    startTransition(async () => {
      const result = await deleteTask(taskId);
      if (result.success) {
        router.refresh();
      } else {
        setGoals(previousGoals);
        toast.error("Failed to delete phase");
      }
    });
  };

  const handleUpdateTask = (goalId: string, taskId: string, title: string) => {
    const previousGoals = goals;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
          };
        }
        return g;
      })
    );

    startTransition(async () => {
      const result = await updateTask(taskId, title);
      if (!result.success) {
        setGoals(previousGoals);
        toast.error("Failed to update phase");
      }
    });
  };

  // --- Subtask Handlers ---

  const handleCreateSubTask = (
    goalId: string,
    taskId: string,
    title: string
  ) => {
    const tempId = `temp-sub-${Date.now()}`;
    const optimisticSub: SubTaskWithRelations = {
      id: tempId,
      title,
      taskId,
      isComplete: false,
      highlights: [],
    };

    const previousGoals = goals;

    // 1. Optimistic Update (Deep)
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedTasks = g.tasks.map((t) => {
            if (t.id === taskId) {
              const newSubtasks = [...t.subtasks, optimisticSub];
              const newPercentage = calculateTaskPercentage(newSubtasks);
              return { ...t, subtasks: newSubtasks, percentage: newPercentage };
            }
            return t;
          });
          return {
            ...g,
            tasks: updatedTasks,
            percentage: calculateGoalPercentage(updatedTasks),
          };
        }
        return g;
      })
    );

    // 2. Server Action
    startTransition(async () => {
      try {
        const result = await createSubTask(taskId, title);
        if (result.success && result.data) {
          // Swap temp ID
          setGoals((prev) =>
            prev.map((g) => {
              if (g.id === goalId) {
                return {
                  ...g,
                  tasks: g.tasks.map((t) => {
                    if (t.id === taskId) {
                      return {
                        ...t,
                        subtasks: t.subtasks.map((s) =>
                          s.id === tempId
                            ? (result.data as SubTaskWithRelations)
                            : s
                        ),
                      };
                    }
                    return t;
                  }),
                };
              }
              return g;
            })
          );
          router.refresh();
        } else {
          setGoals(previousGoals);
          toast.error("Failed to add step");
        }
      } catch {
        setGoals(previousGoals);
        toast.error("Error adding step");
      }
    });
  };

  const handleToggleSubTask = (
    goalId: string,
    taskId: string,
    subTaskId: string
  ) => {
    const previousGoals = goals;

    // 1. Optimistic Update (Deep Recalculation)
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedTasks = g.tasks.map((t) => {
            if (t.id === taskId) {
              const newSubtasks = t.subtasks.map((s) =>
                s.id === subTaskId ? { ...s, isComplete: !s.isComplete } : s
              );
              const newPercentage = calculateTaskPercentage(newSubtasks);
              return { ...t, subtasks: newSubtasks, percentage: newPercentage };
            }
            return t;
          });
          return {
            ...g,
            tasks: updatedTasks,
            percentage: calculateGoalPercentage(updatedTasks),
          };
        }
        return g;
      })
    );

    // 2. Server Action
    startTransition(async () => {
      try {
        const result = await toggleSubTask(subTaskId);
        if (result.success) {
          router.refresh(); // Ensure eventual consistency
        } else {
          setGoals(previousGoals);
          toast.error("Failed to update status");
        }
      } catch {
        setGoals(previousGoals);
        toast.error("Connection error");
      }
    });
  };

  const handleDeleteSubTask = (
    goalId: string,
    taskId: string,
    subTaskId: string
  ) => {
    const previousGoals = goals;

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedTasks = g.tasks.map((t) => {
            if (t.id === taskId) {
              const newSubtasks = t.subtasks.filter((s) => s.id !== subTaskId);
              const newPercentage = calculateTaskPercentage(newSubtasks);
              return { ...t, subtasks: newSubtasks, percentage: newPercentage };
            }
            return t;
          });
          return {
            ...g,
            tasks: updatedTasks,
            percentage: calculateGoalPercentage(updatedTasks),
          };
        }
        return g;
      })
    );

    startTransition(async () => {
      const result = await deleteSubTask(subTaskId);
      if (result.success) {
        router.refresh();
      } else {
        setGoals(previousGoals);
        toast.error("Failed to delete step");
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight">
            {year} Goals
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            High-level objectives broken down into actionable phases.
          </p>
        </div>
        <Button
          onClick={() => setIsAddingGoal(!isAddingGoal)}
          size="lg"
          className={cn(
            "shadow-sm transition-all",
            isAddingGoal && "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {isAddingGoal ? (
            <X className="w-4 h-4 mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isAddingGoal ? "Cancel" : "New Goal"}
        </Button>
      </div>

      {/* Goal Creation Input */}
      <AnimatePresence>
        {isAddingGoal && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-2 border-primary/10 shadow-md bg-secondary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="What is your main objective? (e.g., Run a Marathon)"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateGoal()}
                    autoFocus
                    className="flex-1 text-lg h-12"
                  />
                  <Button
                    onClick={handleCreateGoal}
                    disabled={!newGoalTitle.trim()}
                    size="lg"
                    className="h-12 px-8"
                  >
                    Create Goal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals Grid */}
      <div className="grid gap-6">
        {goals.length === 0 && !isAddingGoal ? (
          <div className="text-center py-24 border-2 border-dashed border-border/50 rounded-xl bg-secondary/5">
            <Target className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              No goals set for {year}
            </h3>
            <p className="text-muted-foreground mb-6">
              Start by defining what success looks like.
            </p>
            <Button onClick={() => setIsAddingGoal(true)} variant="outline">
              Create Your First Goal
            </Button>
          </div>
        ) : (
          goals.map((goal, i) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              index={i}
              onUpdate={handleUpdateGoal}
              onDelete={handleDeleteGoal}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCreateSubTask={handleCreateSubTask}
              onToggleSubTask={handleToggleSubTask}
              onDeleteSubTask={handleDeleteSubTask}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

interface GoalItemProps {
  goal: GoalWithRelations;
  index: number;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onCreateTask: (goalId: string, title: string) => void;
  onUpdateTask: (goalId: string, taskId: string, title: string) => void;
  onDeleteTask: (goalId: string, taskId: string) => void;
  onCreateSubTask: (goalId: string, taskId: string, title: string) => void;
  onToggleSubTask: (goalId: string, taskId: string, subTaskId: string) => void;
  onDeleteSubTask: (goalId: string, taskId: string, subTaskId: string) => void;
}

function GoalItem({
  goal,
  index,
  onUpdate,
  onDelete,
  ...taskProps
}: GoalItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);

  const handleUpdate = () => {
    if (!editTitle.trim()) return;
    onUpdate(goal.id, editTitle);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Delete this goal and all tasks?")) {
      onDelete(goal.id);
    }
  };

  const getStatus = (p: number) => {
    if (p === 100)
      return {
        label: "Completed",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    if (p >= 66)
      return {
        label: "On Track",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
    if (p >= 33)
      return {
        label: "In Progress",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    if (p > 0)
      return {
        label: "Started",
        color: "bg-orange-50 text-orange-700 border-orange-200",
      };
    return {
      label: "Not Started",
      color: "bg-secondary text-muted-foreground border-border",
    };
  };

  const status = getStatus(goal.percentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden border-border/60 hover:border-border hover:shadow-sm transition-all duration-300">
        <CardHeader className="pb-4 bg-gradient-to-r from-background to-secondary/20">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 font-serif text-lg"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleUpdate}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <CardTitle className="font-serif text-2xl text-foreground flex items-center gap-3">
                    {goal.title}
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-sans font-normal border ml-2",
                        status.color
                      )}
                    >
                      {status.label}
                    </Badge>
                  </CardTitle>
                )}
              </div>
              <div className="flex items-center gap-3 max-w-md">
                <Progress value={goal.percentage} className="h-2 flex-1" />
                <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                  {goal.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Title
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="roadmap" className="border-none">
              <AccordionTrigger className="px-6 py-3 text-sm text-muted-foreground hover:no-underline bg-secondary/10 hover:bg-secondary/20 transition-colors">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  View Roadmap ({goal.tasks.length} Phases)
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-4 bg-card/50">
                <TaskList goalId={goal.id} tasks={goal.tasks} {...taskProps} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface TaskListProps {
  goalId: string;
  tasks: TaskWithRelations[];
  onCreateTask: (goalId: string, title: string) => void;
  onUpdateTask: (goalId: string, taskId: string, title: string) => void;
  onDeleteTask: (goalId: string, taskId: string) => void;
  onCreateSubTask: (goalId: string, taskId: string, title: string) => void;
  onToggleSubTask: (goalId: string, taskId: string, subTaskId: string) => void;
  onDeleteSubTask: (goalId: string, taskId: string, subTaskId: string) => void;
}

function TaskList({
  goalId,
  tasks,
  onCreateTask,
  ...itemProps
}: TaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleCreate = () => {
    if (!newTaskTitle.trim()) return;
    onCreateTask(goalId, newTaskTitle);
    setNewTaskTitle("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem key={task.id} goalId={goalId} task={task} {...itemProps} />
      ))}
      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 items-center"
        >
          <Input
            placeholder="Phase title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="h-9"
            autoFocus
          />
          <Button size="sm" onClick={handleCreate}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </motion.div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="text-muted-foreground hover:text-primary w-full justify-start pl-0 hover:bg-transparent"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Phase
        </Button>
      )}
    </div>
  );
}

interface TaskItemProps {
  goalId: string;
  task: TaskWithRelations;
  onUpdateTask: (goalId: string, taskId: string, title: string) => void;
  onDeleteTask: (goalId: string, taskId: string) => void;
  onCreateSubTask: (goalId: string, taskId: string, title: string) => void;
  onToggleSubTask: (goalId: string, taskId: string, subTaskId: string) => void;
  onDeleteSubTask: (goalId: string, taskId: string, subTaskId: string) => void;
}

function TaskItem({
  goalId,
  task,
  onUpdateTask,
  onDeleteTask,
  ...subProps
}: TaskItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleUpdate = () => {
    if (!editTitle.trim()) return;
    onUpdateTask(goalId, task.id, editTitle);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Delete this phase?")) {
      onDeleteTask(goalId, task.id);
    }
  };

  const isComplete = task.percentage === 100;

  return (
    <div className="border border-border/50 rounded-lg bg-background shadow-sm hover:shadow-md transition-all duration-200 group/task">
      <div className="flex items-center gap-3 p-3 rounded-md">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-secondary rounded text-muted-foreground transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-7 text-sm"
                autoFocus
              />
              <Button size="icon-sm" className="h-7 w-7" onClick={handleUpdate}>
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <span
                className={cn(
                  "font-medium text-sm sm:text-base truncate",
                  isComplete && "text-muted-foreground line-through"
                )}
              >
                {task.title}
              </span>
              <div className="flex items-center gap-3 opacity-0 group-hover/task:opacity-100 transition-opacity">
                {task.percentage > 0 && task.percentage < 100 && (
                  <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    {task.percentage.toFixed(0)}%
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pl-12 pr-4 pb-4 pt-0">
              <SubTaskList
                goalId={goalId}
                taskId={task.id}
                subtasks={task.subtasks}
                {...subProps}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SubTaskListProps {
  goalId: string;
  taskId: string;
  subtasks: SubTaskWithRelations[];
  onCreateSubTask: (goalId: string, taskId: string, title: string) => void;
  onToggleSubTask: (goalId: string, taskId: string, subTaskId: string) => void;
  onDeleteSubTask: (goalId: string, taskId: string, subTaskId: string) => void;
}

function SubTaskList({
  goalId,
  taskId,
  subtasks,
  onCreateSubTask,
  onToggleSubTask,
  onDeleteSubTask,
}: SubTaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    onCreateSubTask(goalId, taskId, title);
    setTitle("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-1 relative">
      <div className="absolute left-[-19px] top-0 bottom-4 w-px bg-border/50" />
      {subtasks.map((st) => (
        <div
          key={st.id}
          className="group/sub flex items-center gap-3 py-1.5 text-sm min-h-[32px]"
        >
          <div className="absolute left-[-22px] w-1.5 h-1.5 rounded-full bg-border" />
          <button
            onClick={() => onToggleSubTask(goalId, taskId, st.id)}
            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
          >
            {st.isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
          <span
            className={cn(
              "flex-1 truncate",
              st.isComplete && "text-muted-foreground line-through"
            )}
          >
            {st.title}
          </span>
          <button
            onClick={() => onDeleteSubTask(goalId, taskId, st.id)}
            className="opacity-0 group-hover/sub:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {isAdding ? (
        <div className="flex gap-2 items-center mt-2 pl-7">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Next step..."
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" className="h-8" onClick={handleAdd}>
            Add
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary mt-2 pl-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Step
        </button>
      )}
    </div>
  );
}
