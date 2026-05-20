import { useEffect, useMemo, useState } from "react";
import { CloudSun, Droplets, Leaf, Loader2, MapPin, PenTool, Sprout, Thermometer, Wind } from "lucide-react";
import { Field } from "@/data/fields";
import { invokeWithRetry } from "@/lib/invoke-with-retry";

interface WeatherViewProps {
  activeField: Field | null;
  selectedFields: Field[];
  allFields: Field[];
}

interface LiveWeather {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  wind_speed_10m?: number;
}

interface NdviStats {
  mean_ndvi?: number;
}

function getCenter(field: Field): [number, number] {
  const coords = field.coordinates[0] || [];
  const total = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
  return coords.length ? [total[0] / coords.length, total[1] / coords.length] : [44.3661, 33.3152];
}

function plantStatus(ndvi?: number) {
  if (ndvi == null) return { label: "غير متوفر", detail: "حدد أرضك ثم افتح صحة النبات.", color: "#9CA36B" };
  if (ndvi > 0.6) return { label: "جيد", detail: "النبات قوي، استمر بمتابعة الري.", color: "#7BC75B" };
  if (ndvi > 0.4) return { label: "مقبول", detail: "الحالة مستقرة لكن تحتاج متابعة.", color: "#C8B95E" };
  if (ndvi > 0.2) return { label: "ضعيف نسبيا", detail: "راجع الري والتسميد وافحص الأرض.", color: "#E2A83B" };
  return { label: "ضعيف", detail: "يفضل فحص الأرض ميدانيا بسرعة.", color: "#D95A45" };
}

function recommendation(field: Field, weather: LiveWeather | null, ndvi?: number) {
  const temp = weather?.temperature_2m;
  if (temp != null && temp > 38) return "الحرارة عالية. اسقِ بالصباح الباكر أو بعد الغروب وابتعد عن وقت الظهر.";
  if (ndvi != null && ndvi < 0.35) return "النبات يحتاج متابعة. افحص الرطوبة والملوحة، ولا تزيد السماد قبل التأكد من الماء.";
  if (field.crop.toLowerCase().includes("rice") || field.crop.includes("رز")) return "للرز، لا تترك الأرض تجف لفترة طويلة وتابع توفر الماء يوميا.";
  return "تابع الأرض اليوم. إذا التربة جافة تحت السطح، أعطِ رية خفيفة ومنتظمة.";
}

const WeatherView = ({ activeField, selectedFields, allFields }: WeatherViewProps) => {
  const field = activeField || selectedFields[0] || allFields[0] || null;
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [ndvi, setNdvi] = useState<NdviStats | null>(null);
  const [soilMoisture, setSoilMoisture] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!field) return;
    let cancelled = false;
    const [lng, lat] = getCenter(field);

    const load = async () => {
      setLoading(true);
      setWeather(null);
      setNdvi(null);
      setSoilMoisture(null);

      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;
        const response = await fetch(weatherUrl);
        const data = await response.json();
        if (!cancelled) setWeather(data.current || null);
      } catch {
        if (!cancelled) setWeather(null);
      }

      try {
        const soilUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=soil_moisture_0_to_1cm&forecast_days=1&timezone=auto`;
        const response = await fetch(soilUrl);
        const data = await response.json();
        const vals = (data?.hourly?.soil_moisture_0_to_1cm || []).filter((v: number) => typeof v === "number");
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
        if (!cancelled) setNdvi(data);
      } catch {
        if (!cancelled) setNdvi(null);
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [field]);

  const status = useMemo(() => plantStatus(ndvi?.mean_ndvi), [ndvi]);
  const today = useMemo(() => field ? recommendation(field, weather, ndvi?.mean_ndvi) : "", [field, weather, ndvi]);
  const areaDunam = field ? Math.round(field.area * 4 * 10) / 10 : 0;

  if (!field) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background p-6" dir="rtl">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-lg border border-border bg-card flex items-center justify-center">
            <PenTool className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">ابدأ بتحديد أرضك</h2>
          <p className="text-sm text-muted-foreground leading-6">اضغط زر القلم على الخريطة وارسم حدود الأرض حتى يعطيك فرماي نصيحة مفيدة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-background p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="space-y-2">
          <div className="text-sm text-primary font-medium">نصيحة اليوم</div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">{field.name}</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{field.location}</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">أهم إجراء الآن</div>
              <p className="text-xl font-semibold text-foreground leading-9 mt-2">{today}</p>
            </div>
            <CloudSun className="w-9 h-9 text-primary flex-shrink-0" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card/70 p-4">
            <Thermometer className="w-5 h-5 text-primary mb-3" />
            <div className="text-xs text-muted-foreground">الحرارة</div>
            <div className="text-xl font-semibold text-foreground mt-1">{weather?.temperature_2m != null ? `${Math.round(weather.temperature_2m)}°C` : "غير متوفر"}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-4">
            <Droplets className="w-5 h-5 text-primary mb-3" />
            <div className="text-xs text-muted-foreground">رطوبة الجو</div>
            <div className="text-xl font-semibold text-foreground mt-1">{weather?.relative_humidity_2m != null ? `${weather.relative_humidity_2m}%` : "غير متوفر"}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-4">
            <Wind className="w-5 h-5 text-primary mb-3" />
            <div className="text-xs text-muted-foreground">الرياح</div>
            <div className="text-xl font-semibold text-foreground mt-1">{weather?.wind_speed_10m != null ? `${Math.round(weather.wind_speed_10m)} كم/س` : "غير متوفر"}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-4">
            <Sprout className="w-5 h-5 text-primary mb-3" />
            <div className="text-xs text-muted-foreground">المساحة</div>
            <div className="text-xl font-semibold text-foreground mt-1">{areaDunam} دونم</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card/70 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Leaf className="w-5 h-5" style={{ color: status.color }} /> حالة النبات
            </div>
            <div className="text-xl font-semibold mt-4" style={{ color: status.color }}>{status.label}</div>
            <p className="text-sm text-muted-foreground leading-6 mt-2">{status.detail}</p>
            {ndvi?.mean_ndvi != null && <div className="text-xs text-muted-foreground mt-3">NDVI: {ndvi.mean_ndvi.toFixed(2)}</div>}
          </div>

          <div className="rounded-lg border border-border bg-card/70 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Droplets className="w-5 h-5 text-primary" /> الماء والري
            </div>
            <div className="text-xl font-semibold text-primary mt-4">{soilMoisture != null ? `${soilMoisture}% رطوبة سطحية` : "افحص التربة يدويا"}</div>
            <p className="text-sm text-muted-foreground leading-6 mt-2">
              {soilMoisture != null && soilMoisture < 20
                ? "الرطوبة منخفضة. الأفضل ترتيب رية قريبة حسب نوع المحصول."
                : "لا تزيد الري إلا إذا كانت التربة جافة تحت السطح."}
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> جاري تحديث النصيحة...
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherView;
