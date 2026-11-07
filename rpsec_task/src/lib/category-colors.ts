/**
 * Category dots. The class strings are written out in full (instead of built
 * from the id) so Tailwind can see them while scanning the source.
 */
const CATEGORY_DOT_CLASSES = [
  "bg-cat-work",
  "bg-cat-personal",
  "bg-cat-financial",
  "bg-cat-other",
] as const;

export function categoryDotClass(categoryId: number): string {
  return CATEGORY_DOT_CLASSES[Math.abs(categoryId) % CATEGORY_DOT_CLASSES.length];
}
