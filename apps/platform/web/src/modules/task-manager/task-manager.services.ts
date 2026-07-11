import { apiDelete, apiGet, apiPost, apiPut } from "../../shared/api/platform-api";
import type { Todo, TodoInput, TodoStatus } from "./task-manager.types";
export const listTodos = () => apiGet<Todo[]>("/task-manager/todos", "tenant");
export const createTodo = (input: TodoInput) => apiPost<Todo>("/task-manager/todos", input, "tenant");
export const updateTodo = (id: string, input: Partial<TodoInput>) => apiPut<Todo>(`/task-manager/todos/${id}`, input, "tenant");
export const setTodoStatus = (id: string, status: TodoStatus) => apiPost<Todo>(`/task-manager/todos/${id}/status`, { status }, "tenant");
export const deleteTodo = (id: string) => apiDelete<{ id: string; deleted: boolean }>(`/task-manager/todos/${id}`, "tenant");
