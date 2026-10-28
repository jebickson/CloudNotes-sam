

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Note = {

  id: string;

  title: string;

  content: string;

  updatedAt: string;

  updatedAtMs: number;

  color: string;

  favorite: boolean;

};

type ApiNote = {

  id: string;

  title: string;

  content: string;

};

type ActiveView = "all" | "favorites" | "recent";

type MobileView = "notes" | "editor";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/notes`;


const FAVORITES_KEY = "cloudnotes-favorite-ids-v1";

const META_KEY = "cloudnotes-note-metadata-v1";

const COLORS = ["yellow", "blue", "pink"];

async function request<T>(

  url: string,

  options?: RequestInit

): Promise<T> {

  const response = await fetch(url, {

    ...options,

    headers: {

      "Content-Type": "application/json",

      ...options?.headers,

    },

  });

  if (!response.ok) {

    let message = `Request failed (${response.status})`;

    try {

      const body = await response.json();

      if (body.message) message = body.message;

    } catch {

      // Keep the HTTP error message.

    }

    throw new Error(message);

  }

  return response.json() as Promise<T>;

}

export default function Home() {

  const [notes, setNotes] = useState<Note[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [activeView, setActiveView] = useState<ActiveView>("all");

  const [mobileView, setMobileView] = useState<MobileView>("notes");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [metadata, setMetadata] = useState<

    Record<string, { color: string; updatedAtMs: number }>

  >({});

  const [storageReady, setStorageReady] = useState(false);

  // Keep the latest preferences available without recreating loadNotes.
  const metadataRef = useRef(metadata);
  const favoriteIdsRef = useRef(favoriteIds);

  const [pendingIds, setPendingIds] = useState<string[]>([]);

  // Refs always hold the latest values, including during rapid typing.

  const notesRef = useRef<Note[]>([]);

  const saveTimers = useRef(

    new Map<string, ReturnType<typeof setTimeout>>()

  );

  const saveVersions = useRef(new Map<string, number>());

  const inFlight = useRef(new Set<string>());

  const deletedIds = useRef(new Set<string>());

  useEffect(() => {

    notesRef.current = notes;

  }, [notes]);

  // Load browser-only preferences.

  useEffect(() => {

    try {

      const favorites = localStorage.getItem(FAVORITES_KEY);

      const savedMetadata = localStorage.getItem(META_KEY);

      if (favorites) {

        const parsed: unknown = JSON.parse(favorites);

        if (

          Array.isArray(parsed) &&

          parsed.every((item) => typeof item === "string")

        ) {

          setFavoriteIds(parsed);

        }

      }

      if (savedMetadata) {

        const parsed: unknown = JSON.parse(savedMetadata);

        if (

          parsed &&

          typeof parsed === "object" &&

          !Array.isArray(parsed)

        ) {

          setMetadata(

            parsed as Record<

              string,

              { color: string; updatedAtMs: number }

            >

          );

        }

      }

    } catch (err) {

      console.error("Could not load local preferences:", err);

    } finally {

      setStorageReady(true);

    }

  }, []);

  useEffect(() => {

    if (!storageReady) return;

    try {

      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));

      localStorage.setItem(META_KEY, JSON.stringify(metadata));

    } catch (err) {

      console.error("Could not save local preferences:", err);

    }

  }, [favoriteIds, metadata, storageReady]);

  const loadNotes = useCallback(async () => {

    setLoading(true);

    setError("");

    try {

      const data = await request<ApiNote[]>(API);

      const normalized: Note[] = data.map((item, index) => {

        const saved = metadataRef.current[item.id];

        return {

          id: item.id,

          title: item.title,

          content: item.content ?? "",

          updatedAt: saved ? "Saved" : "From DynamoDB",

          updatedAtMs: saved?.updatedAtMs ?? data.length - index,

          color: saved?.color ?? COLORS[index % COLORS.length],

          favorite: favoriteIdsRef.current.includes(item.id),

        };

      });

      // Do not replace notes while a user is editing or saving.

      if (inFlight.current.size === 0) {

        notesRef.current = normalized;

        setNotes(normalized);

        setSelectedId((current) =>

          normalized.some((note) => note.id === current)

            ? current

            : normalized[0]?.id ?? null

        );

      }

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Could not load notes."

      );

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    if (storageReady) void loadNotes();

  }, [storageReady, loadNotes]);

  useEffect(() => {

    return () => {

      for (const timer of saveTimers.current.values()) {

        clearTimeout(timer);

      }

    };

  }, []);

  const selectedNote = notes.find((note) => note.id === selectedId);

  const favoriteCount = notes.filter((note) => note.favorite).length;

  const filteredNotes = notes

    .filter((note) => {

      const matchesSearch = `${note.title} ${note.content}`

        .toLowerCase()

        .includes(search.toLowerCase().trim());

      return (

        matchesSearch &&

        (activeView !== "favorites" || note.favorite)

      );

    })

    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);

  function updateMetadata(note: Note) {

    setMetadata((current) => ({

      ...current,

      [note.id]: {

        color: note.color,

        updatedAtMs: note.updatedAtMs,

      },

    }));

  }

  // Debounced save. Each note has a version to prevent stale responses

  // from marking newer edits as saved.

  function scheduleSave(id: string) {

    const previousTimer = saveTimers.current.get(id);

    if (previousTimer) clearTimeout(previousTimer);

    const version = (saveVersions.current.get(id) ?? 0) + 1;

    saveVersions.current.set(id, version);

    const note = notesRef.current.find((item) => item.id === id);

    if (!note || !note.title.trim()) {

      setPendingIds((current) =>

        current.filter((pendingId) => pendingId !== id)

      );

      return;

    }

    setPendingIds((current) =>

      current.includes(id) ? current : [...current, id]

    );

    const timer = setTimeout(async () => {

      // Read the latest text when the timer fires, not an old snapshot.

      const latest = notesRef.current.find((item) => item.id === id);

      if (!latest || !latest.title.trim() || deletedIds.current.has(id)) {

        setPendingIds((current) =>

          current.filter((pendingId) => pendingId !== id)

        );

        saveTimers.current.delete(id);

        return;

      }

      inFlight.current.add(id);

      try {

        await request<ApiNote>(`${API}/${encodeURIComponent(id)}`, {

          method: "PUT",

          body: JSON.stringify({

            title: latest.title.trim(),

            content: latest.content,

          }),

        });

        // Only the newest request can update the save status.

        if (

          saveVersions.current.get(id) === version &&

          !deletedIds.current.has(id)

        ) {

          const currentNotes = notesRef.current.map((item) =>

            item.id === id ? { ...item, updatedAt: "Saved" } : item

          );

          notesRef.current = currentNotes;

          setNotes(currentNotes);

          setError("");

        }

      } catch (err) {

        if (saveVersions.current.get(id) === version) {

          setError(

            err instanceof Error ? err.message : "Could not save note."

          );

        }

      } finally {

        inFlight.current.delete(id);

        if (saveVersions.current.get(id) === version) {

          setPendingIds((current) =>

            current.filter((pendingId) => pendingId !== id)

          );

          saveTimers.current.delete(id);

        } else {

          // A newer edit arrived while the request was running.

          scheduleSave(id);

        }

      }

    }, 800);

    saveTimers.current.set(id, timer);

  }

  function updateNoteField(

    id: string,

    field: "title" | "content",

    value: string

  ) {

    const current = notesRef.current.find((item) => item.id === id);

    if (!current) return;

    const updated: Note = {

      ...current,

      [field]: value,

      updatedAt: "Unsaved changes",

      updatedAtMs: Date.now(),

    };

    const next = notesRef.current.map((item) =>

      item.id === id ? updated : item

    );

    // Update immediately. Never wait for a network request while typing.

    notesRef.current = next;

    setNotes(next);

    updateMetadata(updated);

    setError("");

    // Do not send a blank title to the backend.

    if (!updated.title.trim()) {

      const timer = saveTimers.current.get(id);

      if (timer) clearTimeout(timer);

      saveTimers.current.delete(id);

      setPendingIds((currentIds) =>

        currentIds.filter((pendingId) => pendingId !== id)

      );

      return;

    }

    scheduleSave(id);

  }

  async function createNote() {

    setSaving(true);

    setError("");

    try {

      const created = await request<ApiNote>(API, {

        method: "POST",

        body: JSON.stringify({

          title: "Untitled note",

          content: "",

        }),

      });

      const note: Note = {

        id: created.id,

        title: created.title,

        content: created.content ?? "",

        updatedAt: "Saved",

        updatedAtMs: Date.now(),

        color: COLORS[notesRef.current.length % COLORS.length],

        favorite: false,

      };

      const next = [note, ...notesRef.current];

      notesRef.current = next;

      setNotes(next);

      setSelectedId(note.id);

      setActiveView("all");

      setSearch("");

      setMobileView("editor");

      updateMetadata(note);

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Could not create note."

      );

    } finally {

      setSaving(false);

    }

  }

  function toggleFavorite() {

    if (!selectedNote) return;

    const id = selectedNote.id;

    const nextFavorite = !selectedNote.favorite;

    setFavoriteIds((current) =>

      nextFavorite

        ? [...new Set([...current, id])]

        : current.filter((favoriteId) => favoriteId !== id)

    );

    const next = notesRef.current.map((note) =>

      note.id === id ? { ...note, favorite: nextFavorite } : note

    );

    notesRef.current = next;

    setNotes(next);

  }

  async function deleteSelected() {

    if (!selectedNote) return;

    const id = selectedNote.id;

    const timer = saveTimers.current.get(id);

    if (timer) clearTimeout(timer);

    saveTimers.current.delete(id);

    // Prevent an old save response from updating a deleted note.

    deletedIds.current.add(id);

    saveVersions.current.set(id, (saveVersions.current.get(id) ?? 0) + 1);

    setSaving(true);

    setError("");

    try {

      await request<{ message: string }>(

        `${API}/${encodeURIComponent(id)}`,

        { method: "DELETE" }

      );

      const next = notesRef.current.filter((note) => note.id !== id);

      notesRef.current = next;

      setNotes(next);

      setSelectedId(next[0]?.id ?? null);

      setFavoriteIds((current) =>

        current.filter((favoriteId) => favoriteId !== id)

      );

      setMetadata((current) => {

        const result = { ...current };

        delete result[id];

        return result;

      });

      if (!next.length) setMobileView("notes");

    } catch (err) {

      deletedIds.current.delete(id);

      setError(

        err instanceof Error ? err.message : "Could not delete note."

      );

    } finally {

      setSaving(false);

    }

  }

  function openView(view: ActiveView) {

    setActiveView(view);

    setSearch("");

    setMobileView("notes");

  }

  const viewTitle =

    activeView === "favorites"

      ? "Favorites"

      : activeView === "recent"

        ? "Recently edited"

        : "All notes";

  const isPending = Boolean(

    selectedNote && pendingIds.includes(selectedNote.id)

  );

  return (

    <main className="app-shell">

      <aside className="sidebar">

        <button

          className="brand"

          onClick={() => openView("all")}

          aria-label="CloudNotes home"

        >

          <span className="brand-icon">✳</span>

          <span>cloudnotes<span className="brand-dot">.</span></span>

        </button>

        <button

          className="new-note-button"

          onClick={() => void createNote()}

          disabled={saving}

        >

          <span>＋</span> New note

          <span className="shortcut">Ctrl N</span>

        </button>

        <p className="nav-label">WORKSPACE</p>

        <button

          className={`nav-item ${activeView === "all" ? "active" : ""}`}

          onClick={() => openView("all")}

        >

          <span className="nav-symbol">▤</span>

          <span>All notes</span>

          <span className="nav-count">{notes.length}</span>

        </button>

        <button

          className={`nav-item ${

            activeView === "favorites" ? "active" : ""

          }`}

          onClick={() => openView("favorites")}

        >

          <span className="nav-symbol">☆</span>

          <span>Favorites</span>

          <span className="nav-count">{favoriteCount}</span>

        </button>

        <button

          className={`nav-item ${

            activeView === "recent" ? "active" : ""

          }`}

          onClick={() => openView("recent")}

        >

          <span className="nav-symbol">◷</span>

          <span>Recently edited</span>

        </button>

        <div className="sidebar-bottom">

          <div className="storage-card">

            <div className="storage-icon">☁</div>

            <strong>Your thoughts, safe.</strong>

            <p>Connected to your notes workspace.</p>

            <div className="storage-track"><span /></div>

            <small>Cloud API · Local development</small>

          </div>

          <div className="profile">

            <div className="avatar">C</div>

            <div className="profile-copy">

              <strong>CloudNotes</strong>

              <small>Personal workspace</small>

            </div>

            <span className="profile-menu">···</span>

          </div>

        </div>

      </aside>

      <section

        className={`notes-panel ${

          mobileView === "editor" ? "mobile-hidden" : ""

        }`}

      >

        <header className="panel-header">

          <div>

            <p className="eyebrow">YOUR WORKSPACE</p>

            <h1>

              {viewTitle}

              <span className="title-count">{filteredNotes.length}</span>

            </h1>

            <p className="subheading">

              {activeView === "favorites"

                ? "Your most-loved ideas, all together."

                : activeView === "recent"

                  ? "Pick up where you left off."

                  : "A little space for everything on your mind."}

            </p>

          </div>

          <button

            className="mobile-new"

            onClick={() => void createNote()}

            disabled={saving}

            aria-label="Create a new note"

          >

            ＋

          </button>

        </header>

        <label className="search-box">

          <span className="search-icon">⌕</span>

          <input

            value={search}

            onChange={(event) => setSearch(event.target.value)}

            placeholder="Search your notes..."

            aria-label="Search notes"

          />

          {search && (

            <button

              className="clear-search"

              type="button"

              onClick={() => setSearch("")}

              aria-label="Clear search"

            >

              ×

            </button>

          )}

        </label>

        <div className="list-heading">

          <span>YOUR NOTES</span>

          <span>UPDATED</span>

        </div>

        <div className="notes-list">

          {loading ? (

            <div className="empty-state">

              <strong>Loading your notes…</strong>

              <p>Connecting to your CloudNotes API.</p>

            </div>

          ) : (

            filteredNotes.map((note) => (

              <button

                key={note.id}

                className={`note-row ${

                  selectedId === note.id ? "selected" : ""

                }`}

                onClick={() => {

                  setSelectedId(note.id);

                  setMobileView("editor");

                }}

              >

                <span className={`note-marker ${note.color}`} />

                <span className="note-row-copy">

                  <strong>{note.title || "Untitled note"}</strong>

                  <small>

                    {note.content || "Start writing your note..."}

                  </small>

                </span>

                {note.favorite && (

                  <span className="list-favorite">★</span>

                )}

                <time>{note.updatedAt}</time>

              </button>

            ))

          )}

          {!loading && filteredNotes.length === 0 && (

            <div className="empty-state">

              <span className="empty-icon">✳</span>

              <strong>

                {activeView === "favorites"

                  ? "No favorites yet"

                  : "No notes found"}

              </strong>

              <p>

                {activeView === "favorites"

                  ? "Favorite a note to keep it close."

                  : "Try another search or create a note."}

              </p>

              <button

                className="text-button"

                onClick={() => void createNote()}

                disabled={saving}

              >

                ＋ Create a note

              </button>

            </div>

          )}

        </div>

        <div className="list-footer">

          <span className="footer-sparkle">✳</span>

          {loading ? "Loading…" : `${filteredNotes.length} notes shown`}

        </div>

      </section>

      <section

        className={`editor-panel ${

          mobileView === "notes" ? "mobile-hidden" : ""

        }`}

      >

        {selectedNote ? (

          <>

            <header className="editor-toolbar">

              <button

                className="back-to-notes"

                onClick={() => setMobileView("notes")}

              >

                <span>←</span> Notes

              </button>

              <div className="save-status">

                <span />

                {isPending ? "Saving changes…" : "Connected to API"}

              </div>

              <div className="editor-actions">

                <button

                  className={`favorite-button ${

                    selectedNote.favorite ? "is-favorite" : ""

                  }`}

                  onClick={toggleFavorite}

                  aria-pressed={selectedNote.favorite}

                >

                  {selectedNote.favorite ? "★ Saved" : "☆ Favorite"}

                </button>

                <button

                  className="delete-button"

                  onClick={() => void deleteSelected()}

                  disabled={saving}

                >

                  Delete

                </button>

              </div>

            </header>

            <article className="editor-content">

              <div className="editor-meta">

                <span className={`note-marker large ${selectedNote.color}`} />

                <span>PERSONAL NOTE</span>

              </div>

              <input

                className="note-title-input"

                value={selectedNote.title}

                onChange={(event) =>

                  updateNoteField(

                    selectedNote.id,

                    "title",

                    event.target.value

                  )

                }

                placeholder="Give your note a title..."

                aria-label="Note title"

                autoComplete="off"

                spellCheck

              />

              <div className="note-date">

                {isPending ? "Saving changes…" : selectedNote.updatedAt}

              </div>

              <div className="editor-divider" />

              <textarea

                className="note-body-input"

                value={selectedNote.content}

                onChange={(event) =>

                  updateNoteField(

                    selectedNote.id,

                    "content",

                    event.target.value

                  )

                }

                placeholder="Start writing your thoughts here..."

                aria-label="Note content"

              />

              <div className="editor-tip">

                <span>✦</span>

                <p>

                  <strong>A little reminder</strong>

                  <br />

                  Good ideas start somewhere. Capture yours here.

                </p>

              </div>

            </article>

            <footer className="editor-footer">

              <span>

                CloudNotes <span className="footer-separator">/</span> Editor

              </span>

              <span>{selectedNote.content.length} characters</span>

            </footer>

          </>

        ) : (

          <div className="editor-empty">

            <span className="editor-empty-icon">✳</span>

            <h2>

              {loading ? "Loading your notes…" : "Your next idea starts here."}

            </h2>

            <p>

              {loading

                ? "Connecting to your backend."

                : "Create a note or select one from your list."}

            </p>

            {!loading && (

              <button

                className="new-note-button"

                onClick={() => void createNote()}

              >

                ＋ Create a note

              </button>

            )}

          </div>

        )}

      </section>

      {error && (

        <div className="api-error" role="alert">

          <span>{error}</span>

          <button

            onClick={() => setError("")}

            aria-label="Dismiss error"

          >

            ×

          </button>

        </div>

      )}

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">

        <button

          className={mobileView === "notes" ? "current" : ""}

          onClick={() => setMobileView("notes")}

        >

          <span>▤</span> Notes

        </button>

        <button onClick={() => void createNote()} disabled={saving}>

          <span className="mobile-create-icon">＋</span> New note

        </button>

        <button

          className={mobileView === "editor" ? "current" : ""}

          onClick={() => {

            if (!selectedNote) void createNote();

            else setMobileView("editor");

          }}

        >

          <span>✎</span> Editor

        </button>

      </nav>

    </main>

  );

}
