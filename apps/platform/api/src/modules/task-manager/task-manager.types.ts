export type TodoStatus = "backlog" | "open" | "in-progress" | "review" | "blocked" | "completed" | "cancelled";
export type TodoPriority = "low" | "medium" | "high" | "urgent";
export type Todo = { id: string; title: string; description: string; status: TodoStatus; priority: TodoPriority; dueDate: string; position: number; createdAt: string; updatedAt: string };
export type TodoInput = Partial<Pick<Todo, "title" | "description" | "status" | "priority" | "dueDate">> & { title: string };
