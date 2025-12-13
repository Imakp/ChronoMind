"use client";

import { useState, useTransition } from "react";
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
  updateSubTask,
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
import { getUserFriendlyError } from "@/lib/error-handler";
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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    startTransition(async () => {
      const result = await createGoal(yearId, newGoalTitle.trim());
      if (result.success) {
        setNewGoalTitle("");
        setIsAddingGoal(false);
        router.refresh();
        toast.success("Goal created successfully");
        if (result.data) {
          setGoals(prev => [...prev, result.data!]);
        }
      } else {
        toast.error(getUserFriendlyError(result.error));
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
                    disabled={!newGoalTitle.trim() || isPending}
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
            <GoalItem key={goal.id} goal={goal} index={i} router={router} />
          ))
        )}
      </div>
    </div>
  );
}

// --- Sub-components for cleaner structure ---

function GoalItem({
  goal,
  index,
  router,
}: {
  goal: GoalWithRelations;
  index: number;
  router: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      await updateGoal(goal.id, editTitle);
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this goal and all tasks?")) {
      startTransition(async () => {
        await deleteGoal(goal.id);
        router.refresh();
      });
    }
  };

  // Status Logic
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
                <TaskList goalId={goal.id} tasks={goal.tasks} router={router} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TaskList({
  goalId,
  tasks,
  router,
}: {
  goalId: string;
  tasks: TaskWithRelations[];
  router: any;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    startTransition(async () => {
      await createTask(goalId, newTaskTitle);
      setNewTaskTitle("");
      setIsAdding(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} router={router} />
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
            onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
            className="h-9"
            autoFocus
          />
          <Button size="sm" onClick={handleCreateTask}>
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

function TaskItem({ task, router }: { task: TaskWithRelations; router: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      await updateTask(task.id, editTitle);
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this phase?")) {
      startTransition(async () => {
        await deleteTask(task.id);
        router.refresh();
      });
    }
  };

  const isComplete = task.percentage === 100;

  return (
    <div className="border border-border/50 rounded-lg bg-background shadow-sm hover:shadow-md transition-all duration-200 group/task">
      {/* Task Header Row */}
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

      {/* Subtasks Container */}
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
                taskId={task.id}
                subtasks={task.subtasks}
                router={router}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubTaskList({
  taskId,
  subtasks,
  router,
}: {
  taskId: string;
  subtasks: SubTaskWithRelations[];
  router: any;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      await createSubTask(taskId, title);
      setTitle("");
      setIsAdding(false);
      router.refresh();
    });
  };

  const handleToggle = (subtaskId: string) => {
    startTransition(async () => {
      await toggleSubTask(subtaskId);
      router.refresh();
    });
  };

  const handleDelete = (subtaskId: string) => {
    startTransition(async () => {
      await deleteSubTask(subtaskId);
      router.refresh();
    });
  };

  return (
    <div className="space-y-1 relative">
      {/* Connector Line */}
      <div className="absolute left-[-19px] top-0 bottom-4 w-px bg-border/50" />
      {subtasks.map((st) => (
        <div
          key={st.id}
          className="group/sub flex items-center gap-3 py-1.5 text-sm min-h-[32px]"
        >
          {/* Connector Dot */}
          <div className="absolute left-[-22px] w-1.5 h-1.5 rounded-full bg-border" />
          <button
            onClick={() => handleToggle(st.id)}
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
            onClick={() => handleDelete(st.id)}
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
