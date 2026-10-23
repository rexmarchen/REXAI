import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../src/db.js";
import { deferOverduePosts, nextSlot } from "../src/scheduler.js";

const book = (iso: string) =>
  db.prepare("INSERT INTO posts (kind, src_path, media_url, status, scheduled_at) VALUES ('IMAGE', ?, 'u', 'approved', ?)").run(`p-${iso}`, iso);

describe("nextSlot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("fills slots in order and respects MAX_POSTS_PER_DAY", () => {
    const a = nextSlot();
    expect(a).toBe("2026-10-01T09:00:00.000Z");
    book(a);
    const b = nextSlot();
    expect(b).toBe("2026-10-01T13:00:00.000Z");
    book(b);
    // Day is now full (cap 2), so the next post rolls to tomorrow's first slot.
    expect(nextSlot()).toBe("2026-10-02T09:00:00.000Z");
  });

  it("skips slots that are already in the past", () => {
    vi.setSystemTime(new Date("2026-10-05T10:00:00Z"));
    expect(nextSlot()).toBe("2026-10-05T13:00:00.000Z");
  });

  it("re-queues significantly overdue approved posts instead of leaving a publishable backlog", () => {
    vi.setSystemTime(new Date("2026-10-09T13:48:00Z"));
    const first = book("2026-10-08T11:30:00.000Z");
    const second = db
      .prepare("INSERT INTO posts (kind, src_path, media_url, status, scheduled_at) VALUES ('REEL', ?, 'u', 'approved', ?)")
      .run("missed-reel", "2026-10-08T13:30:00.000Z");

    const deferred = deferOverduePosts();

    expect(deferred.filter(({ id }) => [first.lastInsertRowid, second.lastInsertRowid].includes(id)).map(({ id }) => id))
      .toEqual([first.lastInsertRowid, second.lastInsertRowid]);
    expect(deferred.every(({ scheduled_at }) => new Date(scheduled_at).getTime() > Date.now())).toBe(true);
    expect(db.prepare("SELECT status FROM posts WHERE id = ?").get(first.lastInsertRowid)).toEqual({ status: "approved" });
    expect(deferOverduePosts()).toEqual([]);
  });

  it("keeps a recently missed slot eligible for normal publishing", () => {
    vi.setSystemTime(new Date("2026-10-09T13:48:00Z"));
    book("2026-10-09T13:30:00.000Z");

    expect(deferOverduePosts()).toEqual([]);
  });
});
