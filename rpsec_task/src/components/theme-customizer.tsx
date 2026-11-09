import { Sun, Moon, Laptop, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useThemeCustomizer, type ThemeMode, type ThemeColor } from "@/lib/theme";

export function ThemeCustomizer() {
  const { mode, color, setMode, setColor, colors } = useThemeCustomizer();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-foreground relative"
          title="Personalizar Tema e Cores"
          aria-label="Personalizar Tema e Cores"
        >
          {mode === "dark" ? (
            <Moon className="size-4 text-purple-400" />
          ) : mode === "light" ? (
            <Sun className="size-4 text-amber-500" />
          ) : (
            <Laptop className="size-4" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-3.5 space-y-3.5">
        {/* Seletor de Modo Claro / Escuro */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sun className="size-3.5 text-muted-foreground" />
            Aparência
          </p>
          <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setMode("light")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === "light"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="size-3.5 text-amber-500" />
              Claro
            </button>
            <button
              type="button"
              onClick={() => setMode("dark")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === "dark"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="size-3.5 text-purple-400" />
              Escuro
            </button>
            <button
              type="button"
              onClick={() => setMode("system")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === "system"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Laptop className="size-3.5" />
              Auto
            </button>
          </div>
        </div>

        {/* Seletor de Cores de Destaque */}
        <div className="space-y-1.5 pt-1 border-t border-border">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Palette className="size-3.5 text-muted-foreground" />
            Cor de Destaque
          </p>
          <div className="flex items-center justify-between gap-1.5 pt-1">
            {colors.map((c) => {
              const isActive = color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${c.previewClass} ${
                    isActive
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 shadow-sm"
                      : "opacity-80 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  {isActive && <Check className="size-4 text-white stroke-[3]" />}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground text-center pt-0.5">
            {colors.find((c) => c.id === color)?.label}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
