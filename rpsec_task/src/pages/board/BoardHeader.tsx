import { Menu, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryDotClass } from "@/lib/category-colors";
import { cn } from "@/lib/utils";
import type { CategoriesDoapp } from "@/types/doapp";

interface BoardHeaderProps {
  title: string;
  category: CategoriesDoapp | null;
  search: string;
  onSearchChange: (value: string) => void;
  onClearCategory: () => void;
  onCreate: () => void;
  onOpenNav: () => void;
}

export function BoardHeader({
  title,
  category,
  search,
  onSearchChange,
  onClearCategory,
  onCreate,
  onOpenNav,
}: BoardHeaderProps) {
  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-background px-4 py-3 md:h-14 md:flex-row md:items-center md:gap-3 md:px-6 md:py-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="size-9 shrink-0 md:hidden"
          onClick={onOpenNav}
        >
          <Menu className="size-5" />
        </Button>

        <h1 className="truncate text-xl font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h1>

        {category && (
          <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/60 pl-2 pr-1 text-xs font-medium text-muted-foreground">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full ring-1 ring-inset ring-foreground/10",
                categoryDotClass(category.id),
              )}
            />
            {category.description}
            <button
              type="button"
              aria-label="Clear the category filter"
              className="inline-flex size-4 items-center justify-center rounded-full transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onClearCategory}
            >
              <X className="size-3" />
            </button>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 md:ml-auto">
        <div className="relative min-w-0 flex-1 md:w-[260px] md:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search demands"
            aria-label="Search demands"
            className="h-9 pl-9"
          />
        </div>

        <Button type="button" className="h-9 shrink-0" onClick={onCreate}>
          <Plus className="size-4" />
          New demand
        </Button>
      </div>
    </header>
  );
}
