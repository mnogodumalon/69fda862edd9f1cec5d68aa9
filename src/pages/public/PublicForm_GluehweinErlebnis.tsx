import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconChevronDown, IconCrosshair, IconLoader2 } from '@tabler/icons-react';
import { GeoMapPicker } from '@/components/GeoMapPicker';
import { lookupKey, lookupKeys } from '@/lib/formatters';

// Empty PROXY_BASE → relative URLs (dashboard and form-proxy share the domain).
const PROXY_BASE = '';
const APP_ID = '69fda85323b7007a5763586b';
const SUBMIT_PATH = `/rest/apps/${APP_ID}/records`;
const ALTCHA_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js';

async function submitPublicForm(fields: Record<string, unknown>, captchaToken: string) {
  const res = await fetch(`${PROXY_BASE}/api${SUBMIT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Captcha-Token': captchaToken,
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Submission failed');
  }
  return res.json();
}


function cleanFields(fields: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (typeof value === 'object' && !Array.isArray(value) && 'key' in (value as any)) {
      cleaned[key] = (value as any).key;
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item =>
        typeof item === 'object' && item !== null && 'key' in item ? item.key : item
      );
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export default function PublicFormGluehweinErlebnis() {
  const [fields, setFields] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoFromPhoto, setGeoFromPhoto] = useState(false);
  const [showCoords, setShowCoords] = useState(false);
  const captchaRef = useRef<HTMLElement | null>(null);

  async function geoLocate(fieldKey: string) {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let info = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data.display_name) info = data.display_name;
        } catch { /* ignore */ }
        setFields(f => ({ ...f, [fieldKey]: { lat, long: lng, info } }));
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  function handleMapMove(fieldKey: string, lat: number, lng: number) {
    setFields(f => ({ ...f, [fieldKey]: { ...(f[fieldKey] ?? {}), lat, long: lng } }));
  }

  void setGeoFromPhoto;

  // Load the ALTCHA web component script once per page.
  useEffect(() => {
    if (document.querySelector(`script[src="${ALTCHA_SCRIPT_SRC}"]`)) return;
    const s = document.createElement('script');
    s.src = ALTCHA_SCRIPT_SRC;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return;
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const prefill: Record<string, any> = {};
    params.forEach((value, key) => { prefill[key] = value; });
    if (Object.keys(prefill).length) setFields(prev => ({ ...prefill, ...prev }));
  }, []);

  function readCaptchaToken(): string | null {
    const el = captchaRef.current as any;
    if (!el) return null;
    return el.value || el.getAttribute('value') || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = readCaptchaToken();
    if (!token) {
      setError('Bitte warte auf die Spam-Prüfung und versuche es erneut.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicForm(cleanFields(fields), token);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Vielen Dank!</h2>
          <p className="text-muted-foreground">Deine Eingabe wurde erfolgreich übermittelt.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setFields({}); }}>
            Weitere Eingabe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Glühwein Erlebnis — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="datum">Datum & Uhrzeit</Label>
            <Input
              id="datum"
              type="datetime-local"
              step="60"
              value={fields.datum ?? ''}
              onChange={e => setFields(f => ({ ...f, datum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ort">Ort / Veranstaltung</Label>
            <Input
              id="ort"
              value={fields.ort ?? ''}
              onChange={e => setFields(f => ({ ...f, ort: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rezeptname">Rezeptname / Bezeichnung</Label>
            <Input
              id="rezeptname"
              value={fields.rezeptname ?? ''}
              onChange={e => setFields(f => ({ ...f, rezeptname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zutaten">Zutaten</Label>
            <Textarea
              id="zutaten"
              value={fields.zutaten ?? ''}
              onChange={e => setFields(f => ({ ...f, zutaten: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zubereitung">Zubereitung</Label>
            <Textarea
              id="zubereitung"
              value={fields.zubereitung ?? ''}
              onChange={e => setFields(f => ({ ...f, zubereitung: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weinsorte">Weinsorte</Label>
            <Select
              value={lookupKey(fields.weinsorte) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, weinsorte: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="weinsorte"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="weisswein">Weißwein</SelectItem>
                <SelectItem value="rose">Rosé</SelectItem>
                <SelectItem value="alkoholfrei">Alkoholfrei</SelectItem>
                <SelectItem value="rotwein">Rotwein</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bewertung">Bewertung</Label>
            <Select
              value={lookupKey(fields.bewertung) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, bewertung: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="bewertung"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="stern_1">⭐ (1 Stern)</SelectItem>
                <SelectItem value="stern_2">⭐⭐ (2 Sterne)</SelectItem>
                <SelectItem value="stern_3">⭐⭐⭐ (3 Sterne)</SelectItem>
                <SelectItem value="stern_4">⭐⭐⭐⭐ (4 Sterne)</SelectItem>
                <SelectItem value="stern_5">⭐⭐⭐⭐⭐ (5 Sterne)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="besonderheiten">Besonderheiten</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="besonderheiten_sehr_suess"
                  checked={lookupKeys(fields.besonderheiten).includes('sehr_suess')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.besonderheiten);
                      const next = checked ? [...current, 'sehr_suess'] : current.filter(k => k !== 'sehr_suess');
                      return { ...f, besonderheiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="besonderheiten_sehr_suess" className="font-normal">Sehr süß</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="besonderheiten_wuerzig"
                  checked={lookupKeys(fields.besonderheiten).includes('wuerzig')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.besonderheiten);
                      const next = checked ? [...current, 'wuerzig'] : current.filter(k => k !== 'wuerzig');
                      return { ...f, besonderheiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="besonderheiten_wuerzig" className="font-normal">Würzig</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="besonderheiten_fruchtig"
                  checked={lookupKeys(fields.besonderheiten).includes('fruchtig')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.besonderheiten);
                      const next = checked ? [...current, 'fruchtig'] : current.filter(k => k !== 'fruchtig');
                      return { ...f, besonderheiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="besonderheiten_fruchtig" className="font-normal">Fruchtig</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="besonderheiten_scharf"
                  checked={lookupKeys(fields.besonderheiten).includes('scharf')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.besonderheiten);
                      const next = checked ? [...current, 'scharf'] : current.filter(k => k !== 'scharf');
                      return { ...f, besonderheiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="besonderheiten_scharf" className="font-normal">Scharf</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="besonderheiten_cremig"
                  checked={lookupKeys(fields.besonderheiten).includes('cremig')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.besonderheiten);
                      const next = checked ? [...current, 'cremig'] : current.filter(k => k !== 'cremig');
                      return { ...f, besonderheiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="besonderheiten_cremig" className="font-normal">Cremig</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="besonderheiten_traditionell"
                  checked={lookupKeys(fields.besonderheiten).includes('traditionell')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.besonderheiten);
                      const next = checked ? [...current, 'traditionell'] : current.filter(k => k !== 'traditionell');
                      return { ...f, besonderheiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="besonderheiten_traditionell" className="font-normal">Traditionell</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notizen">Persönliche Notizen</Label>
            <Textarea
              id="notizen"
              value={fields.notizen ?? ''}
              onChange={e => setFields(f => ({ ...f, notizen: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="standort">Standort</Label>
            <div className="space-y-3">
              <Button type="button" variant="outline" className="w-full" disabled={locating} onClick={() => geoLocate("standort")}>
                {locating ? <IconLoader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <IconCrosshair className="h-4 w-4 mr-1.5" />}
                Aktuellen Standort verwenden
              </Button>
              {geoFromPhoto && fields.standort && (
                <p className="text-xs text-primary italic">Standort aus Foto übernommen</p>
              )}
              {fields.standort?.info && (
                <p className="text-sm text-muted-foreground break-words whitespace-normal">
                  {fields.standort.info}
                </p>
              )}
              {fields.standort?.lat != null && fields.standort?.long != null && (
                <GeoMapPicker
                  lat={fields.standort.lat}
                  lng={fields.standort.long}
                  onChange={(lat, lng) => handleMapMove("standort", lat, lng)}
                />
              )}
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors" onClick={() => setShowCoords(v => !v)}>
                {showCoords ? 'Koordinaten verbergen' : 'Koordinaten anzeigen'}
                <IconChevronDown className={`h-3 w-3 transition-transform ${showCoords ? "rotate-180" : ""}`} />
              </button>
              {showCoords && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Breitengrad</Label>
                    <Input type="number" step="any"
                      value={fields.standort?.lat ?? ''}
                      onChange={e => {
                        const v = e.target.value;
                        setFields(f => ({ ...f, standort: { ...(f.standort as any ?? {}), lat: v ? Number(v) : undefined } }));
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Längengrad</Label>
                    <Input type="number" step="any"
                      value={fields.standort?.long ?? ''}
                      onChange={e => {
                        const v = e.target.value;
                        setFields(f => ({ ...f, standort: { ...(f.standort as any ?? {}), long: v ? Number(v) : undefined } }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <altcha-widget
            ref={captchaRef as any}
            challengeurl={`${PROXY_BASE}/api/_challenge?path=${encodeURIComponent(SUBMIT_PATH)}`}
            auto="onsubmit"
            hidefooter
          />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Wird gesendet...' : 'Absenden'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Powered by Klar
        </p>
      </div>
    </div>
  );
}
