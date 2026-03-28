"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Mic, Clock, Sparkles, User } from "lucide-react";
import { initialTodos, voiceDumpSession, type TodoItem } from "@/lib/actions-mock-data";

export function TodoVoicePanel() {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [newTodo, setNewTodo] = useState("");

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos(prev => [
      { id: `t${Date.now()}`, text: newTodo.trim(), done: false, source: "manual", createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setNewTodo("");
  };

  const sourceIcon = (source: string) => {
    switch (source) {
      case "voice": return <Mic className="size-3 text-muted-foreground" />;
      case "ai": return <Sparkles className="size-3 text-muted-foreground" />;
      default: return <User className="size-3 text-muted-foreground" />;
    }
  };

  const activeTodos = todos.filter(t => !t.done);
  const doneTodos = todos.filter(t => t.done);

  return (
    <div className="space-y-4">
      {/* Add todo */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a task..."
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTodo()}
          className="h-9"
        />
        <Button size="sm" onClick={addTodo} disabled={!newTodo.trim()}>
          <Plus className="size-3.5" /> Add
        </Button>
      </div>

      {/* Active todos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">To-do</CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-[10px]">{activeTodos.length} remaining</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-0.5">
          {activeTodos.map(todo => (
            <label
              key={todo.id}
              className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors"
            >
              <Checkbox
                checked={todo.done}
                onCheckedChange={() => toggleTodo(todo.id)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <span className="text-sm">{todo.text}</span>
              </div>
              {sourceIcon(todo.source)}
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Completed */}
      {doneTodos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {doneTodos.map(todo => (
              <label
                key={todo.id}
                className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors"
              >
                <Checkbox checked={todo.done} onCheckedChange={() => toggleTodo(todo.id)} className="mt-0.5" />
                <span className="text-sm text-muted-foreground line-through">{todo.text}</span>
                {sourceIcon(todo.source)}
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Voice Log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Mic className="size-4" />
            Voice Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Voice dump</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {voiceDumpSession.duration} &middot; {new Date(voiceDumpSession.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground italic">&ldquo;{voiceDumpSession.transcript}&rdquo;</p>
            <Separator className="my-3" />
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Parsed items ({voiceDumpSession.parsedItems.length})</div>
            <div className="space-y-1.5">
              {voiceDumpSession.parsedItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-xs">
                  <Badge variant={item.category === "action" ? "default" : "secondary"} className="text-[9px] px-1.5">{item.category === "action" ? "A" : "T"}</Badge>
                  <span className="flex-1">{item.text}</span>
                  {item.clientName && <span className="text-muted-foreground">{item.clientName.split(" ")[0]}</span>}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
