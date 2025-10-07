"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Memo = {
  id: number;
  text: string;
};

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [newMemo, setNewMemo] = useState("");

  useEffect(() => {
    fetchMem
  }, []);

  const fetchMemos = async () => {
    try {
      const res = await fetch(`${API_URL}/memos`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setMemos(data);
    } catch (error) {
      console.error("Failed to fetch memos:", error);
    }
  };

  const handleAddMemo = async () => {
    if (!newMemo.trim()) return;
    try {
      const res = await fetch(`${API_URL}/memos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMemo }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setNewMemo("");
      fetchMemos();
    } catch (error) {
      console.error("Failed to add memo:", error);
    }
  };

  const handleDeleteMemo = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/memos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      fetchMemos();
    } catch (error) {
      console.error("Failed to delete memo:", error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Memo App</h1>
      <div className="w-full max-w-md">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            className="flex-grow p-2 border rounded text-black"
            placeholder="新しいメモを入力"
          />
          <button
            onClick={handleAddMemo}
            className="p-2 bg-blue-500 text-white rounded"
          >
            Add
          </button>
        </div>
        <ul>
          {memos.map((memo) => (
            <li
              key={memo.id}
              className="flex justify-between items-center p-2 border-b"
            >
              <span>{memo.text}</span>
              <button
                onClick={() => handleDeleteMemo(memo.id)}
                className="p-1 bg-red-500 text-white rounded text-xs"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
