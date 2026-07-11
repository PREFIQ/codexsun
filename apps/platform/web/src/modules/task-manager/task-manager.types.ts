export type TodoStatus = "open" | "in-progress" | "completed";
export type TodoPriority = "low" | "medium" | "high";
export type Todo = { id: string; title: string; description: string; status: TodoStatus; priority: TodoPriority; dueDate: string; createdAt: string; updatedAt: string };
export type TodoInput = Partial<Pick<Todo, "title" | "description" | "status" | "priority" | "dueDate">> & { title: string };
