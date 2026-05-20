import { Lightbulb, ListTree, Map } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: "map" | "fields" | "advice";
  onTabChange: (tab: "map" | "fields" | "advice") => void;
}

const tabs = [
  { id: "map" as const, icon: Map, label: "الخريطة" },
  { id: "fields" as const, icon: ListTree, label: "أراضيي" },
  { id: "advice" as const, icon: Lightbulb, label: "النصيحة" },
];

const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  return (
    <div className="fixed bottom-3 left-4 right-4 z-50 flex items-center justify-around h-14 rounded-xl bg-card/90 backdrop-blur-xl border border-border/70 shadow-lg shadow-black/20 safe-area-bottom" dir="rtl">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 ${
            activeTab === id ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div className={`p-1 rounded-lg transition-all duration-200 ${activeTab === id ? "bg-primary/15" : ""}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default MobileBottomNav;
