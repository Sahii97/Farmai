import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CloudSun, Droplets, Edit3, Leaf, Loader2, MapPin, Sprout, Thermometer, Wind } from "lucide-react";
import { Field } from "@/data/fields";
import { invokeWithRetry } from "@/lib/invoke-with-retry";

interface FieldDetailViewProps {
  field: Field;
  onBack: () => void;
  onEditBoundary?: () => void;
}

interface FieldWeather {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  wind_speed_10m?: number;
  apparent_temperature?: number;
}

interface NdviStats {
  mean_ndvi?: number;
  vegetation_health_score?: number;
}

function getCenter(field: Field): [number, number] {
  const coords = field.coordinates[0] || [];
  const total = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
  return coords.length ? [total[0] / coords.length, total[1] / coords.length] : [44.3661, 33.3152];
}

function healthFromNdvi(ndvi?: number): { label: string; detail: string; color: string } {
  if (ndvi == null) return { label: "ننتظر بيانات القمر الصناعي", detail: "افتح صحة النبات من الخريطة أو جرّب لاحقا.", color: "#9CA36B" };
  if (ndvi > 0.6) return { label: "النبات جيد", detail: "الأرض تبين خضار قوي. استمر بالمتابعة والري المعتدل.", color: "#7BC75B" };
  if (ndvi > 0.4) return { label: "النبات مقبول", detail: "الحالة جيدة لكن تحتاج متابعة للري والتسميد.", color: "#C8B95E" };
  if (ndvi > 0.2) return { label: "يحتاج متابعة", detail: "الخضار ضعيف نسبيا. راجع الري وافحص التربة.", color: "#E2A83B" };
  return { label: "النبات ضعيف", detail: "يفضل زيارة الأرض وفحص الماء أو الملوحة أو المرض.", color: "#D95A45" };
}

function waterAdvice(soilMoisture: number | null, humidity?: number): { label: string; detail: string } {
  if (soilMoisture != null) {
    if (soilMoisture < 15) return { label: "اسقِ الأرض قريبا", detail: "رطوبة التربة منخفضة. الأفضل تنظيم رية خفيفة ومتابعة الأرض." };
    if (soilMoisture < 25) return { label: "راقب الري", detail: "الرطوبة متوسطة. انتظر إذا الجو بارد، واسقِ إذا الحرارة عالية." };
    if (soilMoisture > 45) return { label: "خفف الري", detail: "الرطوبة عالية وقد تسبب اختناق للجذور إذا استمرت." };
    return { label: "الري مناسب", detail: "الرطوبة ضمن مدى جيد. لا تزيد الماء بدون حاجة." };
  }
  if (humidity != null && humidity < 25) return { label: "الجو جاف", detail: "تابع التربة خصوصا للمحاصيل الحساسة والجديدة." };
  return { label: "افحص التربة يدويا", detail: "لم تصل بيانات رطوبة دقيقة. خذ حفنة تراب من 10-15 سم وتأكد من الرطوبة." };
}

function cropAdvice(field: Field, ndvi?: number): { crop: string; detail: string } {
  const text = `${field.crop} ${field.location}`.toLowerCase();
  if (text.includes("date") || text.includes("palm") || text.includes("تمر") || text.includes("نخيل")) {
    return { crop: "النخيل والتمر", detail: "ركز على انتظام الري ومراقبة الملوحة حول الجذور." };
  }
  if (text.includes("rice") || text.includes("رز")) {
    return { crop: "الرز", detail: "يناسب المناطق ذات توفر ماء عالي. تابع منسوب الماء ولا تترك الأرض تجف." };
  }
  if (text.includes("tomato") || text.includes("طما")) {
    return { crop: "الطماطة", detail: "مناسب للمتابعة اليومية. انتبه للحرارة العالية ونظّم الري على دفعات." };
  }
  if (ndvi != null && ndvi < 0.35) {
    return { crop: "شعير أو محصول قليل الماء", detail: "إذا الماء محدود، الشعير خيار أهدأ من محاصيل تحتاج ري كثير." };
  }
  return { crop: "حنطة أو شعير", detail: "لأغلب أراضي العراق، ابدأ بمحاصيل معروفة محليا ثم عدّل حسب الماء والتربة." };
}

const FieldDetailView = ({ field, onBack, onEditBoundary }: FieldDetailViewProps) => {
  const [weather, setWeather] = useState<FieldWeather | null>(null);
  const [ndviStats, setNdviStats] = useState<NdviStats | null>(null);
  const [soilMoisture, setSoilMoisture] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const [lng, lat] = getCenter(field);

    const load = async () => {
      setLoading(true);
      setWeather(null);
      setNdviStats(null);
      setSoilMoisture(null);

      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        if (!cancelled) setWeather(weatherData.current || null);
      } catch {
        if (!cancelled) setWeather(null);
      }

      try {
        const soilUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=soil_moisture_0_to_1cm&forecast_days=1&timezone=auto`;
        const soilResponse = await fetch(soilUrl);
        const soilData = await soilResponse.json();
        const vals = (soilData?.hourly?.soil_moisture_0_to_1cm || []).filter((v: number) => typeof v === "number");
        if (!cancelled && vals.length) setSoilMoisture(Math.round(vals[vals.length - 1] * 1000) / 10);
      } catch {
        if (!cancelled) setSoilMoisture(null);
      }

      try {
        const data = await invokeWithRetry<NdviStats>(
          "ndvi-analysis",
          { polygon: field.coordinates[0] },
          { retries: 2, isEmpty: (d) => !d || d.mean_ndvi == null }
        );
        if (!cancelled) setNdviStats(data);
      } catch {
        if (!cancelled) setNdviStats(null);
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [field]);

  const health = useMemo(() => healthFromNdvi(ndviStats?.mean_ndvi), [ndviStats]);
  const water = useMemo(() => waterAdvice(soilMoisture, weather?.relative_humidity_2m), [soilMoisture, weather]);
  const crop = useMemo(() => cropAdvice(field, ndviStats?.mean_ndvi), [field, ndviStats]);
  const areaDunam = Math.round(field.area * 4 * 10) / 10;

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <div className="p-4 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowRight className="w-4 h-4" /> رجوع
        </button>
        <div className="space-y-1">
          <div className="text-xs text-primary font-medium">تقرير الأرض</div>
          <h2 className="text-xl font-semibold text-foreground">{field.name}</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{field.location}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-lg border border-border bg-accent/15 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">حالة النبات</div>
              <div className="text-lg font-semibold mt-1" style={{ color: health.color }}>{health.label}</div>
            </div>
            <Leaf className="w-8 h-8" style={{ color: health.color }} />
          </div>
          <p className="text-sm text-muted-foreground leading-6 mt-3">{health.detail}</p>
          {ndviStats?.mean_ndvi != null && (
            <div className="text-xs text-muted-foreground mt-2">NDVI: {ndviStats.mean_ndvi.toFixed(2)}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card/70 p-3">
            <Thermometer className="w-4 h-4 text-primary mb-2" />
            <div className="text-xs text-muted-foreground">الحرارة</div>
            <div className="text-lg font-semibold text-foreground">{weather?.temperature_2m != null ? `${Math.round(weather.temperature_2m)}°C` : "غير متوفر"}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-3">
            <Wind className="w-4 h-4 text-primary mb-2" />
            <div className="text-xs text-muted-foreground">الرياح</div>
            <div className="text-lg font-semibold text-foreground">{weather?.wind_speed_10m != null ? `${Math.round(weather.wind_speed_10m)} كم/س` : "غير متوفر"}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-3">
            <Droplets className="w-4 h-4 text-primary mb-2" />
            <div className="text-xs text-muted-foreground">رطوبة التربة</div>
            <div className="text-lg font-semibold text-foreground">{soilMoisture != null ? `${soilMoisture}%` : "افحص يدويا"}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-3">
            <Sprout className="w-4 h-4 text-primary mb-2" />
            <div className="text-xs text-muted-foreground">المساحة</div>
            <div className="text-lg font-semibold text-foreground">{areaDunam} دونم</div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CloudSun className="w-4 h-4 text-primary" /> نصيحة الري
          </div>
          <div className="text-base font-semibold text-primary mt-3">{water.label}</div>
          <p className="text-sm text-muted-foreground leading-6 mt-1">{water.detail}</p>
        </div>

        <div className="rounded-lg border border-border bg-card/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sprout className="w-4 h-4 text-primary" /> محصول مناسب
          </div>
          <div className="text-base font-semibold text-primary mt-3">{crop.crop}</div>
          <p className="text-sm text-muted-foreground leading-6 mt-1">{crop.detail}</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> جاري تحديث البيانات...
          </div>
        )}
      </div>

      {onEditBoundary && (
        <div className="p-4 border-t border-border">
          <button
            onClick={onEditBoundary}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> تعديل حدود الأرض
          </button>
        </div>
      )}
    </div>
  );
};

export default FieldDetailView;
