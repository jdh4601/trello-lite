import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    board: { findUnique: vi.fn() },
    boardMember: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  BoardAccessError,
  getBoardAccess,
  requireBoardMember,
  requireBoardOwner,
} from "./board-access";

const boardFind = prisma.board.findUnique as unknown as ReturnType<typeof vi.fn>;
const memberFind = prisma.boardMember.findUnique as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  boardFind.mockReset();
  memberFind.mockReset();
});

describe("board access matrix", () => {
  it("returns null when the board does not exist", async () => {
    boardFind.mockResolvedValue(null);
    expect(await getBoardAccess("u1", "missing")).toBeNull();
  });

  it("owner is also a member implicitly", async () => {
    boardFind.mockResolvedValue({ ownerId: "u1" });
    const access = await getBoardAccess("u1", "b1");
    expect(access).toEqual({ isOwner: true, isMember: true });
    expect(memberFind).not.toHaveBeenCalled();
  });

  it("invited member without ownership", async () => {
    boardFind.mockResolvedValue({ ownerId: "owner" });
    memberFind.mockResolvedValue({ boardId: "b1" });
    expect(await getBoardAccess("u2", "b1")).toEqual({
      isOwner: false,
      isMember: true,
    });
  });

  it("non-member outsider", async () => {
    boardFind.mockResolvedValue({ ownerId: "owner" });
    memberFind.mockResolvedValue(null);
    expect(await getBoardAccess("u3", "b1")).toEqual({
      isOwner: false,
      isMember: false,
    });
  });
});

describe("requireBoardOwner", () => {
  it("passes for owner", async () => {
    boardFind.mockResolvedValue({ ownerId: "u1" });
    await expect(requireBoardOwner("u1", "b1")).resolves.toBeUndefined();
  });

  it("throws FORBIDDEN for a non-owner member", async () => {
    boardFind.mockResolvedValue({ ownerId: "owner" });
    memberFind.mockResolvedValue({ boardId: "b1" });
    await expect(requireBoardOwner("u2", "b1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    } satisfies Partial<BoardAccessError>);
  });

  it("throws NOT_FOUND when the board is missing", async () => {
    boardFind.mockResolvedValue(null);
    await expect(requireBoardOwner("u1", "missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<BoardAccessError>);
  });
});

describe("requireBoardMember", () => {
  it("passes for member", async () => {
    boardFind.mockResolvedValue({ ownerId: "owner" });
    memberFind.mockResolvedValue({ boardId: "b1" });
    await expect(requireBoardMember("u2", "b1")).resolves.toBeUndefined();
  });

  it("passes for owner", async () => {
    boardFind.mockResolvedValue({ ownerId: "u1" });
    await expect(requireBoardMember("u1", "b1")).resolves.toBeUndefined();
  });

  it("throws FORBIDDEN for outsider", async () => {
    boardFind.mockResolvedValue({ ownerId: "owner" });
    memberFind.mockResolvedValue(null);
    await expect(requireBoardMember("u3", "b1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    } satisfies Partial<BoardAccessError>);
  });
});
