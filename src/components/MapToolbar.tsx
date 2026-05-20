import { Layers, LocateFixed, Map, PenTool, Satellite } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type MapStyle = "dark" | "satellite";

interface MapToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onStyleChange?: (style: MapStyle) => void;
  onToggleLayers?: () => void;
  onToggleDraw?: () => void;
  onResetNorth?: () => void;
  onLocateUser?: () => void;
  onToggleNdvi?: () => void;
  isDrawing?: boolean;
  showFields?: boolean;
  showNdvi?: boolean;
  defaultStyle?: MapStyle;
}

const MapToolbar = ({
  onStyleChange,
  onToggleLayers,
  onToggleDraw,
  onLocateUser,
  onToggleNdvi,
  isDrawing,
  showFields = true,
  showNdvi = false,
  defaultStyle = "satellite",
}: MapToolbarProps) => {
  const [currentStyle, setCurrentStyle] = useState<MapStyle>(defaultStyle);

  const handleStyleToggle = () => {
    const next: MapStyle = currentStyle === "dark" ? "satellite" : "dark";
    setCurrentStyle(next);
    onStyleChange?.(next);
  };

  const items = [
    { icon: PenTool, onClick: onToggleDraw ?? (() => {}), label: "حدد أرضك", active: isDrawing, primary: true },
    { icon: LocateFixed, onClick: onLocateUser ?? (() => {}), label: "موقعي" },
    { icon: Satellite, onClick: onToggleNdvi ?? (() => {}), label: showNdvi ? "إخفاء صحة النبات" : "صحة النبات", active: showNdvi },
    { icon: Map, onClick: handleStyleToggle, label: currentStyle === "dark" ? "قمر صناعي" : "خريطة داكنة", active: currentStyle === "satellite" },
    { icon: Layers, onClick: onToggleLayers ?? (() => {}), label: showFields ? "إخفاء الأراضي" : "إظهار الأراضي", active: showFields },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10 opacity-95" dir="rtl">
        {items.map(({ icon: Icon, onClick, label, active, primary }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button
                onClick={onClick}
                aria-label={label}
                className={`w-11 h-11 rounded-lg backdrop-blur-sm border flex items-center justify-center transition-colors ${
                  primary || active
                    ? "border-primary/70 bg-primary text-primary-foreground"
                    : "border-border bg-card/90 text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default MapToolbar;
