import { useState } from 'react';
import type { GluehweinErlebnis } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText, IconChevronDown } from '@tabler/icons-react';
import { GeoMapPicker } from '@/components/GeoMapPicker';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface GluehweinErlebnisViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: GluehweinErlebnis | null;
  onEdit: (record: GluehweinErlebnis) => void;
}

export function GluehweinErlebnisViewDialog({ open, onClose, record, onEdit }: GluehweinErlebnisViewDialogProps) {
  const [showCoords, setShowCoords] = useState(false);

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Glühwein Erlebnis anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum & Uhrzeit</Label>
            <p className="text-sm">{formatDate(record.fields.datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ort / Veranstaltung</Label>
            <p className="text-sm">{record.fields.ort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rezeptname / Bezeichnung</Label>
            <p className="text-sm">{record.fields.rezeptname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zutaten</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.zutaten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zubereitung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.zubereitung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Weinsorte</Label>
            <Badge variant="secondary">{record.fields.weinsorte?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bewertung</Label>
            <Badge variant="secondary">{record.fields.bewertung?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Besonderheiten</Label>
            <p className="text-sm">{Array.isArray(record.fields.besonderheiten) ? record.fields.besonderheiten.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Persönliche Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Foto</Label>
            {record.fields.foto ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.foto} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Standort</Label>
            {record.fields.standort?.info && (
              <p className="text-sm text-muted-foreground break-words whitespace-normal">{record.fields.standort.info}</p>
            )}
            {record.fields.standort?.lat != null && record.fields.standort?.long != null && (
              <GeoMapPicker
                lat={record.fields.standort.lat}
                lng={record.fields.standort.long}
                readOnly
              />
            )}
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors" onClick={() => setShowCoords(v => !v)}>
              {showCoords ? 'Koordinaten verbergen' : 'Koordinaten anzeigen'}
              <IconChevronDown className={`h-3 w-3 transition-transform ${showCoords ? "rotate-180" : ""}`} />
            </button>
            {showCoords && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-xs text-muted-foreground">Breitengrad:</span> {record.fields.standort?.lat?.toFixed(6) ?? '—'}</div>
                <div><span className="text-xs text-muted-foreground">Längengrad:</span> {record.fields.standort?.long?.toFixed(6) ?? '—'}</div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}