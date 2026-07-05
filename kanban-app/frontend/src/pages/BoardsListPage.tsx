import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { fetchBoards, createBoard } from "../api/boards";
import { useAuthStore } from "../store/authStore";

export default function BoardsListPage() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: boards, isLoading } = useQuery({ queryKey: ["boards"], queryFn: fetchBoards });

  const createMutation = useMutation({
    mutationFn: () => createBoard({ title }),
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setTitle("");
      navigate(`/boards/${board.id}`);
    },
  });

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Mis Tableros</h1>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{user?.name}</span>
            <button onClick={logout} className="text-red-600 hover:underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) createMutation.mutate();
          }}
          className="flex gap-2 mb-6"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre del nuevo tablero"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            Crear tablero
          </button>
        </form>

        {isLoading ? (
          <p className="text-slate-500 text-sm">Cargando tableros...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {boards?.map((board) => (
              <Link
                key={board.id}
                to={`/boards/${board.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-brand-300 transition"
              >
                <h2 className="font-medium text-slate-900">{board.title}</h2>
                {board.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{board.description}</p>
                )}
              </Link>
            ))}
            {boards?.length === 0 && (
              <p className="text-sm text-slate-500 col-span-full">
                Aún no tienes tableros. ¡Crea el primero arriba!
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
