// The story engine: plays one page's nodes. Pure functions, no React,
// no storage. A play state is plain JSON so it can be saved and restored.
//
// Rules (docs/PRODUCT.md 6.3): nodes play in array order from nodes[0];
// `next` jumps to another id; a choice waits for the learner; the page ends
// at its cliffhanger.

import { successors, type Page, type StoryNode } from "./schema.ts";

export type PlayState = {
  /** Ids of the nodes reached so far, in order. The last one is the current node. */
  path: string[];
  /** For each answered choice node: the index of the option the learner picked. */
  picks: Record<string, number>;
};

/** One line of the chat so far: a node, plus the learner's pick if it was a choice. */
export type Step = { node: StoryNode; pick?: number };

const indexCache = new WeakMap<Page, Map<string, number>>();

function indexOf(page: Page, id: string): number {
  let index = indexCache.get(page);
  if (!index) {
    index = new Map(page.nodes.map((n, i) => [n.id, i]));
    indexCache.set(page, index);
  }
  const i = index.get(id);
  if (i === undefined) throw new Error(`Unknown node "${id}" on ${page.storyId} page ${page.page}`);
  return i;
}

function nodeById(page: Page, id: string): StoryNode {
  return page.nodes[indexOf(page, id)];
}

/** A fresh play state at the start of the page. */
export function startPage(page: Page): PlayState {
  return { path: [page.nodes[0].id], picks: {} };
}

/** The node the learner is on now. */
export function currentNode(page: Page, state: PlayState): StoryNode {
  return nodeById(page, state.path[state.path.length - 1]);
}

/** True when the current node is a choice the learner has not answered yet. */
export function isAwaitingChoice(page: Page, state: PlayState): boolean {
  return currentNode(page, state).type === "choice";
}

/** True when the page has reached its cliffhanger. */
export function isPageEnd(page: Page, state: PlayState): boolean {
  return currentNode(page, state).type === "cliffhanger";
}

/** Move past the current node. Not allowed on a choice (use `choose`) or at the cliffhanger. */
export function advance(page: Page, state: PlayState): PlayState {
  const node = currentNode(page, state);
  if (node.type === "choice") throw new Error(`Node "${node.id}" is a choice: call choose()`);
  if (node.type === "cliffhanger") throw new Error("The page has ended");
  const [nextId] = successors(page.nodes, indexOf(page, node.id));
  if (!nextId) throw new Error(`Node "${node.id}" leads nowhere`);
  return { ...state, path: [...state.path, nextId] };
}

/** Answer the current choice with the option at `optionIndex`. */
export function choose(page: Page, state: PlayState, optionIndex: number): PlayState {
  const node = currentNode(page, state);
  if (node.type !== "choice") throw new Error(`Node "${node.id}" is not a choice`);
  const option = node.options[optionIndex];
  if (!option) throw new Error(`Choice "${node.id}" has no option ${optionIndex}`);
  return {
    path: [...state.path, option.next],
    picks: { ...state.picks, [node.id]: optionIndex },
  };
}

/** The chat so far, oldest first, including the current node. */
export function transcript(page: Page, state: PlayState): Step[] {
  return state.path.map((id) => {
    const node = nodeById(page, id);
    const pick = state.picks[id];
    return pick === undefined ? { node } : { node, pick };
  });
}

/**
 * Check a saved play state against the page by replaying it. Returns a clean
 * state, or null if it no longer fits (for example the content changed).
 */
export function restore(page: Page, saved: PlayState): PlayState | null {
  const { path, picks } = saved;
  if (path.length === 0 || path[0] !== page.nodes[0].id) return null;
  let state = startPage(page);
  try {
    for (let i = 1; i < path.length; i++) {
      const node = currentNode(page, state);
      if (node.type === "choice") {
        const pick = picks[node.id];
        if (pick === undefined) return null;
        state = choose(page, state, pick);
      } else {
        state = advance(page, state);
      }
      if (state.path[i] !== path[i]) return null;
    }
  } catch {
    return null;
  }
  return state;
}
