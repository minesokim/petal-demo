"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, Pen } from "lucide-react";
import { clients } from "@/lib/mock-data";
import { getClientNotes, type ClientNote } from "@/lib/documents-mock-data";

export default function ClientNotesPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const initialNotes = client ? getClientNotes(client.id) : [];
  const [notes, setNotes] = useState<ClientNote[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: ClientNote = {
      id: `n${Date.now()}`,
      clientId: client.id,
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    setNewNote("");
  };

  const startEdit = (note: ClientNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    setNotes(prev => prev.map(n => n.id === editingId ? { ...n, content: editContent, updatedAt: new Date().toISOString() } : n));
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="space-y-2">
        <Textarea
          placeholder={`Private notes about ${client.fullName.split(" ")[0]}...`}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          className="min-h-[80px]"
        />
        <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>
          <Plus className="size-3.5" /> Add note
        </Button>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {notes.map(note => (
          <Card key={note.id}>
            <CardContent className="py-4">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="min-h-[80px]" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed">{note.content}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {note.createdAt !== note.updatedAt && " (edited)"}
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => startEdit(note)}>
                      <Pen className="size-3" /> Edit
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No notes yet. Add private notes about this client above.
          </div>
        )}
      </div>
    </div>
  );
}
