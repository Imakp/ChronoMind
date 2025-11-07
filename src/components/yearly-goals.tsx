"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  createGoal,
  createTask,
  createSubTask,
  toggleSubTask,
  getGoals,
  deleteGoal,
  deleteTask,
  deleteSubTask,
  updateGoal,
  updateTask,
  updateSubTask,
} from "@/lib/actions";
import type { GoalWithRelations } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";

interface YearlyGoalsProps {
  yearId: string;
  year: number;
}

export function YearlyGoals({ yearId, year }: YearlyGoalsProps) {
  const [goals, setGoals] = useState<GoalWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingSubTask, setEditingSubTask] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState<{ [key: string]: string }>(
    {}
  );
  const [newSubTaskTitle, setNewSubTaskTitle] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    loadGoals();
  }, [yearId]);

  const loadGoals = async () => {
    setLoading(true);
    const result = await getGoals(yearId);
    if (result.success && result.data) {
      setGoals(result.data);
    }
    setLoading(false);
  };

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) return;

    const result = await createGoal(yearId, newGoalTitle.trim());
    if (result.success) {
      setNewGoalTitle("");
      await loadGoals();
    }
  };

  const handleCreateTask = async (goalId: string) => {
    const title = newTaskTitle[goalId];
    if (!title?.trim()) return;

    const result = await createTask(goalId, title.trim());
    if (result.success) {
      setNewTaskTitle({ ...newTaskTitle, [goalId]: "" });
      await loadGoals();
    }
  };

  const handleCreateSubTask = async (taskId: string) => {
    const title = newSubTaskTitle[taskId];
    if (!title?.trim()) return;

    const result = await createSubTask(taskId, title.trim());
    if (result.success) {
      setNewSubTaskTitle({ ...newSubTaskTitle, [taskId]: "" });
      await loadGoals();
    }
  };

  const handleToggleSubTask = async (subtaskId: string) => {
    await toggleSubTask(subtaskId);
    await loadGoals();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (
      confirm("Are you sure you want to delete this goal and all its tasks?")
    ) {
      await deleteGoal(goalId);
      await loadGoals();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (
      confirm("Are you sure you want to delete this task and all its subtasks?")
    ) {
      await deleteTask(taskId);
      await loadGoals();
    }
  };

  const handleDeleteSubTask = async (subtaskId: string) => {
    if (confirm("Are you sure you want to delete this subtask?")) {
      await deleteSubTask(subtaskId);
      await loadGoals();
    }
  };

  const startEditGoal = (goalId: string, currentTitle: string) => {
    setEditingGoal(goalId);
    setEditValue(currentTitle);
  };

  const startEditTask = (taskId: string, currentTitle: string) => {
    setEditingTask(taskId);
    setEditValue(currentTitle);
  };

  const startEditSubTask = (subtaskId: string, currentTitle: string) => {
    setEditingSubTask(subtaskId);
    setEditValue(currentTitle);
  };

  const saveEditGoal = async (goalId: string) => {
    if (!editValue.trim()) return;
    await updateGoal(goalId, editValue.trim());
    setEditingGoal(null);
    setEditValue("");
    await loadGoals();
  };

  const saveEditTask = async (taskId: string) => {
    if (!editValue.trim()) return;
    await updateTask(taskId, editValue.trim());
    setEditingTask(null);
    setEditValue("");
    await loadGoals();
  };

  const saveEditSubTask = async (subtaskId: string) => {
    if (!editValue.trim()) return;
    await updateSubTask(subtaskId, editValue.trim());
    setEditingSubTask(null);
    setEditValue("");
    await loadGoals();
  };

  const cancelEdit = () => {
    setEditingGoal(null);
    setEditingTask(null);
    setEditingSubTask(null);
    setEditValue("");
  };

  const toggleGoalExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return "bg-gray-200";
    if (percentage < 33) return "bg-red-500";
    if (percentage < 66) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Yearly Goals for {year}
          </h2>
          <p className="text-gray-600">
            Track your goals with hierarchical progress calculation
          </p>
        </div>

        {/* Create New Goal */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGoal();
              }}
              placeholder="Add a new goal..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleCreateGoal} disabled={!newGoalTitle.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Add Goal
            </Button>
          </div>
        </div>

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Goals Yet
            </h3>
            <p className="text-gray-600">
              Start by adding your first goal for {year}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                {/* Goal Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleGoalExpanded(goal.id)}
                      className="mt-1 text-gray-500 hover:text-gray-700"
                    >
                      {expandedGoals.has(goal.id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      {editingGoal === goal.id ? (
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditGoal(goal.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => saveEditGoal(goal.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {goal.title}
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditGoal(goal.id, goal.title)}
                              className="text-gray-500 hover:text-blue-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">
                            {goal.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgressColor(
                              goal.percentage
                            )}`}
                            style={{ width: `${goal.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {goal.tasks.length} task
                        {goal.tasks.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Goal Content */}
                  {expandedGoals.has(goal.id) && (
                    <div className="mt-4 ml-8 space-y-3">
                      {/* Add Task Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTaskTitle[goal.id] || ""}
                          onChange={(e) =>
                            setNewTaskTitle({
                              ...newTaskTitle,
                              [goal.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateTask(goal.id);
                          }}
                          placeholder="Add a task..."
                          className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCreateTask(goal.id)}
                          disabled={!newTaskTitle[goal.id]?.trim()}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Tasks List */}
                      {goal.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-gray-50 rounded-md p-3 border border-gray-200"
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => toggleTaskExpanded(task.id)}
                              className="mt-1 text-gray-500 hover:text-gray-700"
                            >
                              {expandedTasks.has(task.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <div className="flex-1">
                              {editingTask === task.id ? (
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) =>
                                      setEditValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        saveEditTask(task.id);
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => saveEditTask(task.id)}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {task.title}
                                  </h4>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        startEditTask(task.id, task.title)
                                      }
                                      className="text-gray-500 hover:text-blue-600"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-gray-500 hover:text-red-600"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              {/* Task Progress Bar */}
                              <div className="mb-2">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span className="font-semibold">
                                    {task.percentage.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${getProgressColor(
                                      task.percentage
                                    )}`}
                                    style={{ width: `${task.percentage}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {task.subtasks.length} subtask
                                {task.subtasks.length !== 1 ? "s" : ""}
                              </div>

                              {/* Expanded Task Content */}
                              {expandedTasks.has(task.id) && (
                                <div className="mt-3 space-y-2">
                                  {/* Add SubTask Input */}
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newSubTaskTitle[task.id] || ""}
                                      onChange={(e) =>
                                        setNewSubTaskTitle({
                                          ...newSubTaskTitle,
                                          [task.id]: e.target.value,
                                        })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          handleCreateSubTask(task.id);
                                      }}
                                      placeholder="Add a subtask..."
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleCreateSubTask(task.id)
                                      }
                                      disabled={
                                        !newSubTaskTitle[task.id]?.trim()
                                      }
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>

                                  {/* SubTasks List */}
                                  {task.subtasks.map((subtask) => (
                                    <div
                                      key={subtask.id}
                                      className="flex items-center gap-2 bg-white rounded p-2 border border-gray-200"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={subtask.isComplete}
                                        onChange={() =>
                                          handleToggleSubTask(subtask.id)
                                        }
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                      />
                                      {editingSubTask === subtask.id ? (
                                        <div className="flex gap-2 flex-1">
                                          <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) =>
                                              setEditValue(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter")
                                                saveEditSubTask(subtask.id);
                                              if (e.key === "Escape")
                                                cancelEdit();
                                            }}
                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              saveEditSubTask(subtask.id)
                                            }
                                          >
                                            <Check className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={cancelEdit}
                                          >
                                            <X className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          <span
                                            className={`flex-1 text-sm ${
                                              subtask.isComplete
                                                ? "line-through text-gray-500"
                                                : "text-gray-900"
                                            }`}
                                          >
                                            {subtask.title}
                                          </span>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() =>
                                                startEditSubTask(
                                                  subtask.id,
                                                  subtask.title
                                                )
                                              }
                                              className="text-gray-500 hover:text-blue-600"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleDeleteSubTask(subtask.id)
                                              }
                                              className="text-gray-500 hover:text-red-600"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
