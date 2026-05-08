// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface GluehweinErlebnis {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    ort?: string;
    rezeptname?: string;
    zutaten?: string;
    zubereitung?: string;
    weinsorte?: LookupValue;
    bewertung?: LookupValue;
    besonderheiten?: LookupValue[];
    notizen?: string;
    foto?: string;
    standort?: GeoLocation; // { lat, long, info }
  };
}

export const APP_IDS = {
  GLUEHWEIN_ERLEBNIS: '69fda85323b7007a5763586b',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'gluehwein_erlebnis': {
    weinsorte: [{ key: "weisswein", label: "Weißwein" }, { key: "rose", label: "Rosé" }, { key: "alkoholfrei", label: "Alkoholfrei" }, { key: "rotwein", label: "Rotwein" }],
    bewertung: [{ key: "stern_1", label: "⭐ (1 Stern)" }, { key: "stern_2", label: "⭐⭐ (2 Sterne)" }, { key: "stern_3", label: "⭐⭐⭐ (3 Sterne)" }, { key: "stern_4", label: "⭐⭐⭐⭐ (4 Sterne)" }, { key: "stern_5", label: "⭐⭐⭐⭐⭐ (5 Sterne)" }],
    besonderheiten: [{ key: "sehr_suess", label: "Sehr süß" }, { key: "wuerzig", label: "Würzig" }, { key: "fruchtig", label: "Fruchtig" }, { key: "scharf", label: "Scharf" }, { key: "cremig", label: "Cremig" }, { key: "traditionell", label: "Traditionell" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'gluehwein_erlebnis': {
    'datum': 'date/datetimeminute',
    'ort': 'string/text',
    'rezeptname': 'string/text',
    'zutaten': 'string/textarea',
    'zubereitung': 'string/textarea',
    'weinsorte': 'lookup/radio',
    'bewertung': 'lookup/radio',
    'besonderheiten': 'multiplelookup/checkbox',
    'notizen': 'string/textarea',
    'foto': 'file',
    'standort': 'geo',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateGluehweinErlebnis = StripLookup<GluehweinErlebnis['fields']>;