import { useDashboardData } from '@/hooks/useDashboardData';
import type { GluehweinErlebnis } from '@/types/app';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { GluehweinErlebnisDialog } from '@/components/dialogs/GluehweinErlebnisDialog';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconGlass, IconMapPin,
  IconCalendar, IconSearch, IconX, IconStar,
} from '@tabler/icons-react';
import { StatCard } from '@/components/StatCard';

const APPGROUP_ID = '69fda862edd9f1cec5d68aa9';
const REPAIR_ENDPOINT = '/claude/build/repair';

const RATING_ORDER: Record<string, number> = {
  stern_1: 1, stern_2: 2, stern_3: 3, stern_4: 4, stern_5: 5,
};

const WEINSORTE_COLOR: Record<string, string> = {
  rotwein: 'bg-red-100 text-red-700 border-red-200',
  weisswein: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rose: 'bg-pink-100 text-pink-700 border-pink-200',
  alkoholfrei: 'bg-green-100 text-green-700 border-green-200',
};

function RatingStars({ key: _k, rating }: { key?: string; rating?: string }) {
  const num = rating ? (RATING_ORDER[rating] ?? 0) : 0;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <IconStar
          key={i}
          size={13}
          className={i <= num ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 fill-transparent'}
          stroke={1.5}
        />
      ))}
    </div>
  );
}

export default function DashboardOverview() {
  const {
    gluehweinErlebnis,
    loading, error, fetchAll,
  } = useDashboardData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<GluehweinErlebnis | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GluehweinErlebnis | null>(null);
  const [search, setSearch] = useState('');
  const [filterWein, setFilterWein] = useState<string>('');
  const [filterRating, setFilterRating] = useState<string>('');

  const filtered = useMemo(() => {
    let list = [...gluehweinErlebnis];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(r =>
        (r.fields.rezeptname ?? '').toLowerCase().includes(s) ||
        (r.fields.ort ?? '').toLowerCase().includes(s) ||
        (r.fields.notizen ?? '').toLowerCase().includes(s)
      );
    }
    if (filterWein) list = list.filter(r => r.fields.weinsorte?.key === filterWein);
    if (filterRating) list = list.filter(r => r.fields.bewertung?.key === filterRating);
    // Sort by date descending
    list.sort((a, b) => {
      const da = a.fields.datum ?? a.createdat ?? '';
      const db = b.fields.datum ?? b.createdat ?? '';
      return db.localeCompare(da);
    });
    return list;
  }, [gluehweinErlebnis, search, filterWein, filterRating]);

  const stats = useMemo(() => {
    const total = gluehweinErlebnis.length;
    const rated = gluehweinErlebnis.filter(r => r.fields.bewertung);
    const avgRating = rated.length
      ? rated.reduce((sum, r) => sum + (RATING_ORDER[r.fields.bewertung?.key ?? ''] ?? 0), 0) / rated.length
      : 0;
    const fiveStars = gluehweinErlebnis.filter(r => r.fields.bewertung?.key === 'stern_5').length;
    const orte = new Set(gluehweinErlebnis.map(r => r.fields.ort).filter(Boolean)).size;
    return { total, avgRating, fiveStars, orte };
  }, [gluehweinErlebnis]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteGluehweinErlebni(deleteTarget.record_id);
    fetchAll();
    setDeleteTarget(null);
  };

  const hasFilters = search || filterWein || filterRating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Glühwein Erlebnisse</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Dein persönliches Glühwein-Tagebuch</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0">
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          Neues Erlebnis
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Erlebnisse"
          value={String(stats.total)}
          description="Gesamt"
          icon={<IconGlass size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Ø Bewertung"
          value={stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} ★` : '—'}
          description="Durchschnitt"
          icon={<IconStar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="5-Sterne"
          value={String(stats.fiveStars)}
          description="Top-Erlebnisse"
          icon={<IconStar size={18} className="text-amber-400" />}
        />
        <StatCard
          title="Orte"
          value={String(stats.orte)}
          description="Verschiedene Orte"
          icon={<IconMapPin size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Weinsorte filter */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'rotwein', label: 'Rotwein' },
            { key: 'weisswein', label: 'Weißwein' },
            { key: 'rose', label: 'Rosé' },
            { key: 'alkoholfrei', label: 'Alkoholfrei' },
          ].map(w => (
            <button
              key={w.key}
              onClick={() => setFilterWein(filterWein === w.key ? '' : w.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterWein === w.key
                  ? (WEINSORTE_COLOR[w.key] ?? 'bg-primary text-primary-foreground border-primary')
                  : 'bg-background text-muted-foreground border-input hover:bg-muted/50'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Rating filter */}
        <div className="flex gap-1.5 flex-wrap">
          {[5, 4, 3, 2, 1].map(n => {
            const key = `stern_${n}`;
            return (
              <button
                key={key}
                onClick={() => setFilterRating(filterRating === key ? '' : key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filterRating === key
                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                    : 'bg-background text-muted-foreground border-input hover:bg-muted/50'
                }`}
              >
                {'★'.repeat(n)}
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterWein(''); setFilterRating(''); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground border border-input hover:bg-muted/50 transition-colors"
          >
            <IconX size={13} className="shrink-0" />
            Filter löschen
          </button>
        )}
      </div>

      {/* Card Gallery */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <IconGlass size={32} className="text-muted-foreground" stroke={1.5} />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {hasFilters ? 'Keine Ergebnisse gefunden' : 'Noch keine Erlebnisse'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasFilters ? 'Versuche andere Filter' : 'Trage dein erstes Glühwein-Erlebnis ein!'}
            </p>
          </div>
          {!hasFilters && (
            <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
              <IconPlus size={15} className="mr-1.5 shrink-0" />Erstes Erlebnis hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(record => (
            <ErlebnisCard
              key={record.record_id}
              record={record}
              onEdit={() => { setEditRecord(record); setDialogOpen(true); }}
              onDelete={() => setDeleteTarget(record)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <GluehweinErlebnisDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updateGluehweinErlebni(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createGluehweinErlebni(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['GluehweinErlebnis']}
        enablePhotoLocation={AI_PHOTO_LOCATION['GluehweinErlebnis']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Erlebnis löschen"
        description={`Möchtest du "${deleteTarget?.fields.rezeptname ?? deleteTarget?.fields.ort ?? 'dieses Erlebnis'}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ErlebnisCard({
  record,
  onEdit,
  onDelete,
}: {
  record: GluehweinErlebnis;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const f = record.fields;
  const weinsortKey = f.weinsorte?.key ?? '';
  const weinsortColor = WEINSORTE_COLOR[weinsortKey] ?? 'bg-muted text-muted-foreground border-border';

  return (
    <div className="group rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Foto */}
      {f.foto ? (
        <div className="relative h-44 bg-muted overflow-hidden shrink-0">
          <img
            src={f.foto}
            alt={f.rezeptname ?? 'Glühwein'}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {f.weinsorte && (
            <span className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-medium border ${weinsortColor}`}>
              {f.weinsorte.label}
            </span>
          )}
        </div>
      ) : (
        <div className="relative h-32 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center shrink-0">
          <IconGlass size={40} className="text-red-300" stroke={1.5} />
          {f.weinsorte && (
            <span className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-medium border ${weinsortColor}`}>
              {f.weinsorte.label}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            {f.rezeptname ? (
              <h3 className="font-semibold text-foreground text-sm leading-snug truncate">{f.rezeptname}</h3>
            ) : (
              <h3 className="font-semibold text-muted-foreground text-sm italic truncate">Kein Name</h3>
            )}
            {f.bewertung && (
              <div className="mt-0.5">
                <RatingStars rating={f.bewertung.key} />
              </div>
            )}
          </div>
        </div>

        {f.ort && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <IconMapPin size={12} className="shrink-0" />
            <span className="truncate">{f.ort}</span>
          </div>
        )}

        {f.datum && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconCalendar size={12} className="shrink-0" />
            <span>{formatDate(f.datum)}</span>
          </div>
        )}

        {f.besonderheiten && f.besonderheiten.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {f.besonderheiten.slice(0, 3).map(b => (
              <Badge key={b.key} variant="secondary" className="text-xs px-2 py-0.5 h-auto">
                {b.label}
              </Badge>
            ))}
            {f.besonderheiten.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 h-auto">
                +{f.besonderheiten.length - 3}
              </Badge>
            )}
          </div>
        )}

        {f.notizen && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{f.notizen}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-border/60">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={onEdit}
          >
            <IconPencil size={13} className="mr-1 shrink-0" />
            Bearbeiten
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <IconTrash size={13} className="shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
