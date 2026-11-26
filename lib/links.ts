// URLs for story pages, kept in one place.

/** The story's introduction (setting, set-up, the learner's role), before page 1. */
export function introHref(storyId: string): string {
  return `/story/${storyId}`;
}

export function pageHref(storyId: string, page: number): string {
  return `/story/${storyId}/${page}`;
}

export function lastPageHref(storyId: string): string {
  return `/story/${storyId}/last-page`;
}

/** Where to send a learner whose next page is `page` (`totalPages + 1` = The Last Page). */
export function resumeHref(storyId: string, page: number, totalPages: number): string {
  return page > totalPages ? lastPageHref(storyId) : pageHref(storyId, page);
}
