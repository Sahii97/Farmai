import { useState } from "react";
import { X } from "lucide-react";

const IRAQ_CROPS = ["حنطة", "شعير", "رز", "تمر / نخيل", "طماطة", "خيار", "بطاطا", "بصل", "ذرة", "برسيم"];
const PRESET_COLORS = ["#7BC75B", "#8B9A5B", "#EAB947", "#56B6C2", "#D4A853", "#98C379"];

function calculateAreaAcres(coords: [number, number][]): number {
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  area = Math.abs(area) / 2;
  area = (area * 111000 * 85000) / 4046.86;
  return Math.round(area * 10) / 10;
}

interface NewFieldDialogProps {
  coordinates: [number, number][];
  mapToken?: string;
  existingFieldColors?: string[];
  onSave: (field: {
    name: string;
    crop: string;
    cropEmoji: string;
    area: number;
    color: string;
    location: string;
    group?: string;
    coordinates: [number, number][][];
  }) => void;
  onCancel: () => void;
}

const NewFieldDialog = ({ coordinates, existingFieldColors, onSave, onCancel }: NewFieldDialogProps) => {
  const [name, setName] = useState("");
  const [crop, setCrop] = useState("حنطة");
  const [location, setLocation] = useState("العراق");
  const [color, setColor] = useState(() => {
    const used = new Set((existingFieldColors || []).map(c => c.toUpperCase()));
    return PRESET_COLORS.find(c => !used.has(c.toUpperCase())) || PRESET_COLORS[0];
  });

  const estimatedAcres = calculateAreaAcres(coordinates);
  const estimatedHa = Math.round((estimatedAcres / 2.47105) * 10) / 10;
  const estimatedDunam = Math.round(estimatedHa * 4 * 10) / 10;

  const handleSave = () => {
    const closed = [...coordinates, coordinates[0]] as [number, number][];
    onSave({
      name: name.trim() || `أرض ${new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}`,
      crop,
      cropEmoji: "",
      area: estimatedHa,
      color,
      location: location.trim() || "العراق",
      coordinates: [closed],
    });
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-card rounded-xl border border-border p-5 w-80 max-w-full space-y-4 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">إضافة أرض</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="إغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">اسم الأرض</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: أرض الحنطة"
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
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

        <div>
          <label className="text-xs text-muted-foreground block mb-1">الموقع</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="مثال: واسط، كربلاء، الديوانية"
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">لون الأرض على الخريطة</label>
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

        <div className="rounded-lg bg-accent/15 border border-border px-3 py-2 text-xs text-muted-foreground">
          المساحة التقريبية: <span className="text-foreground font-semibold">{estimatedDunam} دونم</span>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors">إلغاء</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-primary text-primary-foreground">حفظ</button>
        </div>
      </div>
    </div>
  );
};

export default NewFieldDialog;
