import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { Field } from "@/data/fields";

const IRAQ_CROPS = ["حنطة", "شعير", "رز", "تمر / نخيل", "طماطة", "خيار", "بطاطا", "بصل", "ذرة", "برسيم"];
const PRESET_COLORS = ["#7BC75B", "#8B9A5B", "#EAB947", "#56B6C2", "#D4A853", "#98C379"];

interface FieldEditDialogProps {
  field: Field;
  onSave: (updated: Field) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const FieldEditDialog = ({ field, onSave, onDelete, onClose }: FieldEditDialogProps) => {
  const [name, setName] = useState(field.name);
  const [crop, setCrop] = useState(field.crop || "حنطة");
  const [area, setArea] = useState(String(Math.round(field.area * 4 * 10) / 10));
  const [location, setLocation] = useState(field.location);
  const [color, setColor] = useState(field.color);

  const handleSave = () => {
    const areaDunam = parseFloat(area) || Math.round(field.area * 4 * 10) / 10;
    const areaHa = Math.round((areaDunam / 4) * 10) / 10;
    onSave({ ...field, name: name.trim() || field.name, crop, cropEmoji: "", area: areaHa, location: location.trim() || "العراق", color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-card rounded-xl border border-border p-5 w-80 max-w-full space-y-4 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">تعديل الأرض</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="إغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">اسم الأرض</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">المحصول</label>
          <div className="grid grid-cols-2 gap-2">
            {IRAQ_CROPS.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setCrop(item)}
                className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                  crop === item ? "border-primary bg-primary/15 text-primary" : "border-border text-foreground hover:bg-accent/30"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">المساحة (دونم)</label>
            <input
              type="number"
              step="0.1"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">الموقع</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">لون الأرض</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((item) => (
              <button
                key={item}
                onClick={() => setColor(item)}
                className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: item, borderColor: color === item ? "hsl(var(--foreground))" : "transparent", transform: color === item ? "scale(1.12)" : undefined }}
                aria-label={`اختيار اللون ${item}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={() => onDelete(field.id)} className="p-2.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors" title="حذف الأرض">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors">إلغاء</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-primary text-primary-foreground">حفظ</button>
        </div>
      </div>
    </div>
  );
};

export default FieldEditDialog;
