import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { codeFromHash, counts, isRoomCode, joinUrl, leaderboard, type Player, points, roomCode, uniqueName } from "./live.ts";

describe("live quiz", () => {
  it("makes readable six-character room codes", () => {
    for (let i = 0; i < 50; i++) {
      const c = roomCode();
      assert.ok(isRoomCode(c), c);
      assert.doesNotMatch(c, /[0O1I]/);
    }
  });

  it("puts the code in the link's #fragment and reads it back", () => {
    const url = joinUrl("https://example.org/app/", "K7MPQ2");
    assert.equal(url, "https://example.org/app/live#join=K7MPQ2");
    assert.equal(joinUrl("https://example.org/app", "K7MPQ2"), "https://example.org/app/live#join=K7MPQ2");
    assert.equal(codeFromHash("#join=k7mpq2"), "K7MPQ2");
    assert.equal(codeFromHash("#join=K0"), null);
    assert.equal(codeFromHash(""), null);
  });

  it("scores right answers by speed and wrong or late ones as nothing", () => {
    assert.equal(points(true, 0), 1000);
    assert.equal(points(true, 10_000), 750);
    assert.equal(points(true, 20_000), 500);
    assert.equal(points(true, 20_001), 0);
    assert.equal(points(false, 1000), 0);
  });

  it("ranks by score, then by speed", () => {
    const p = (id: string, score: number, ms: number): Player => ({ id, name: id, score, answers: { 0: { choice: "red", ms, points: score } } });
    const board = leaderboard([p("a", 900, 5000), p("b", 1500, 9000), p("c", 900, 3000)]);
    assert.deepEqual(board.map((x) => x.id), ["b", "c", "a"]);
  });

  it("counts the answers by colour", () => {
    const players: Player[] = [
      { id: "1", name: "A", score: 0, answers: { 3: { choice: "red", ms: 1, points: 0 } } },
      { id: "2", name: "B", score: 0, answers: { 3: { choice: "red", ms: 1, points: 0 } } },
      { id: "3", name: "C", score: 0, answers: { 2: { choice: "blue", ms: 1, points: 0 } } },
    ];
    const c = counts(players, 3);
    assert.equal(c.red, 2);
    assert.equal(c.blue, 0);
  });

  it("keeps names unique and fills in empty ones", () => {
    assert.equal(uniqueName("Sam", [], 1), "Sam");
    assert.equal(uniqueName("Sam", ["Sam"], 2), "Sam 2");
    assert.equal(uniqueName("  ", [], 4), "Player 4");
    assert.equal(uniqueName("A".repeat(40), [], 1).length, 20);
  });
});
