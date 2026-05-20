import { Check, Undo2, X } from "lucide-react";

interface MobileDrawPromptProps {
  vertexCount: number;
  onSave: () => void;
  onCancel: () => void;
  onUndo?: () => void;
}

const MobileDrawPrompt = ({ vertexCount, onSave, onCancel, onUndo }: MobileDrawPromptProps) => {
  return (
    <div className="absolute bottom-20 left-4 right-4 z-20 animate-fade-in" dir="rtl">
      <div className="bg-card/95 backdrop-blur-xl rounded-xl border border-border/70 shadow-lg shadow-black/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse bg-primary" />
          <span className="text-sm font-medium text-foreground">تحديد الأرض</span>
          <span className="mr-auto text-xs text-muted-foreground">{vertexCount} نقطة</span>
        </div>
        <p className="text-xs text-muted-foreground">اضغط على الخريطة حتى ترسم حدود الأرض.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" /> إلغاء
          </button>
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={vertexCount === 0}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-40"
              aria-label="تراجع"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onSave}
            disabled={vertexCount < 3}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Check className="w-4 h-4" /> حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawPrompt;
