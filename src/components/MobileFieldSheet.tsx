import { useState } from "react";
import { MapPin, PenTool, Search, X } from "lucide-react";
import { Field } from "@/data/fields";
import FieldCard from "./FieldCard";
import FieldEditDialog from "./FieldEditDialog";

interface MobileFieldSheetProps {
  allFields: Field[];
  selectedFields: Field[];
  activeField: Field | null;
  onFieldClick: (field: Field) => void;
  onFieldDoubleClick: (field: Field) => void;
  onUpdateField: (field: Field) => void;
  onDeleteField: (id: string) => void;
  onClose: () => void;
}

const MobileFieldSheet = ({
  allFields,
  activeField,
  onFieldClick,
  onFieldDoubleClick,
  onUpdateField,
  onDeleteField,
  onClose,
}: MobileFieldSheetProps) => {
  const [search, setSearch] = useState("");
  const [editingField, setEditingField] = useState<Field | null>(null);

  const filtered = allFields.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.crop.toLowerCase().includes(search.toLowerCase()) ||
    f.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-30 bg-background flex flex-col pb-20" dir="rtl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">أراضيي</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="إغلاق">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث باسم الأرض أو المحصول..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 pt-3">
        {filtered.length === 0 && allFields.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-lg border-2 border-dashed border-muted-foreground/40 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">ماكو أرض مضافة بعد</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ارجع للخريطة واضغط زر <PenTool className="inline-block align-text-bottom mx-0.5 text-foreground w-3.5 h-3.5" /> حتى ترسم أول أرض.
              </p>
            </div>
          </div>
        )}

        {filtered.map((field) => (
          <div
            key={field.id}
            onClick={() => onFieldClick(field)}
            onDoubleClick={(e) => { e.preventDefault(); onFieldDoubleClick(field); }}
            className="cursor-pointer"
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

      <div className="p-3 border-t border-border">
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

export default MobileFieldSheet;
