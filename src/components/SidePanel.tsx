import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, PenTool, Search } from "lucide-react";
import { Field } from "@/data/fields";
import FieldCard from "./FieldCard";
import FieldDetailView from "./FieldDetailView";
import FieldEditDialog from "./FieldEditDialog";

interface SidePanelProps {
  allFields: Field[];
  selectedFields: Field[];
  activeField: Field | null;
  detailField: Field | null;
  onFieldClick: (field: Field) => void;
  onFieldDoubleClick: (field: Field) => void;
  onBackFromDetail: () => void;
  onToggleField: (field: Field) => void;
  onApplySelection: (ids: string[]) => void;
  onUpdateField: (field: Field) => void;
  onDeleteField: (id: string) => void;
  onEditBoundary?: (field: Field) => void;
}

const SidePanel = ({
  allFields,
  activeField,
  detailField,
  onFieldClick,
  onFieldDoubleClick,
  onBackFromDetail,
  onUpdateField,
  onDeleteField,
  onEditBoundary,
}: SidePanelProps) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [editingField, setEditingField] = useState<Field | null>(null);

  if (detailField) {
    return (
      <div className={`${isMobile ? "w-full" : "w-[340px]"} h-full bg-card/95 backdrop-blur-md border-r border-border flex flex-col animate-fade-in`} dir="rtl">
        <FieldDetailView
          field={detailField}
          onBack={onBackFromDetail}
          onEditBoundary={onEditBoundary ? () => onEditBoundary(detailField) : undefined}
        />
      </div>
    );
  }

  const filtered = allFields.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.crop.toLowerCase().includes(search.toLowerCase()) ||
    f.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`${isMobile ? "w-full" : "w-[340px]"} h-full bg-card/95 backdrop-blur-md border-r border-border flex flex-col`} dir="rtl">
      <div className="p-4 border-b border-border space-y-1">
        <div className="text-xs text-primary font-medium">فرماي</div>
        <h2 className="text-xl font-semibold text-foreground">أراضيي</h2>
        <p className="text-xs text-muted-foreground leading-5">اختر أرض حتى تشوف النصيحة وحالة النبات.</p>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث باسم الأرض أو المحصول..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 pt-3">
        {allFields.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-lg border-2 border-dashed border-muted-foreground/40 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">ماكو أرض مضافة بعد</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">اضغط زر القلم على الخريطة وحدد حدود أرضك.</p>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-accent/15 border border-border/50 text-right">
              <PenTool className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground">بعد تحديد ثلاث نقاط أو أكثر، اضغط Enter للحفظ.</span>
            </div>
          </div>
        )}

        {filtered.map((field) => (
          <div
            key={field.id}
            onClick={() => onFieldClick(field)}
            onDoubleClick={(e) => { e.preventDefault(); onFieldDoubleClick(field); }}
          >
            <FieldCard
              field={field}
              onRemove={() => setEditingField(field)}
              variant="list"
              isActive={activeField?.id === field.id}
            />
          </div>
        ))}

        {filtered.length === 0 && allFields.length > 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">ماكو نتيجة مطابقة</div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> {filtered.length} أرض
        </div>
      </div>

      {editingField && (
        <FieldEditDialog
          field={editingField}
          onSave={(updated) => { onUpdateField(updated); setEditingField(null); }}
          onDelete={(id) => { onDeleteField(id); setEditingField(null); }}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  );
};

export default SidePanel;
