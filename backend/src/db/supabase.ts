import { config } from 'dotenv';
config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fezjpfcrikzirfypjjcp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
const REST_URL = `${SUPABASE_URL}/rest/v1`;

const headers: Record<string, string> = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

console.log(`[Supabase] REST mode → ${SUPABASE_URL}`);

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
  removeChannel: () => {},
};

class QueryBuilder {
  private table: string;
  private params: URLSearchParams = new URLSearchParams();
  private selectColumns = '*';
  private countMode: 'exact' | null = null;
  private headOnly = false;
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private body: any = null;
  private singleRow = false;
  private limitVal: number | null = null;
  private orderCol: string | null = null;
  private orderAsc = true;
  private rangeStart: number | null = null;
  private rangeEnd: number | null = null;

  constructor(table: string) { this.table = table; }

  select(columns = '*', opts?: { count?: 'exact'; head?: boolean }) {
    this.selectColumns = columns;
    if (opts?.count) this.countMode = opts.count;
    if (opts?.head) this.headOnly = true;
    return this;
  }

  insert(data: any) { this.method = 'POST'; this.body = data; return this; }
  upsert(data: any, opts?: { onConflict?: string }) {
    this.method = 'POST';
    this.body = data;
    if (opts?.onConflict) this.params.set('on_conflict', opts.onConflict);
    return this;
  }
  update(data: any) { this.method = 'PATCH'; this.body = data; return this; }
  delete() { this.method = 'DELETE'; return this; }

  eq(col: string, val: any) { this.params.append(col, `eq.${val}`); return this; }
  neq(col: string, val: any) { this.params.append(col, `neq.${val}`); return this; }
  gt(col: string, val: any) { this.params.append(col, `gt.${val}`); return this; }
  gte(col: string, val: any) { this.params.append(col, `gte.${val}`); return this; }
  lt(col: string, val: any) { this.params.append(col, `lt.${val}`); return this; }
  lte(col: string, val: any) { this.params.append(col, `lte.${val}`); return this; }
  in(col: string, vals: any[]) { this.params.append(col, `in.(${vals.join(',')})`); return this; }
  ilike(col: string, val: string) { this.params.append(col, `ilike.${val}`); return this; }
  contains(col: string, val: any[]) { this.params.append(col, `cs.{${val.join(',')}}`); return this; }
  or(expr: string) { this.params.append('or', `(${expr})`); return this; }

  single() { this.singleRow = true; return this; }
  limit(n: number) { this.limitVal = n; return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.orderCol = col; this.orderAsc = opts?.ascending ?? true; return this; }
  range(start: number, end: number) { this.rangeStart = start; this.rangeEnd = end; return this; }

  async then(resolve: (val: any) => void, reject?: (err: any) => void) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: { message: (err as Error).message }, count: 0 });
    }
  }

  private async execute(): Promise<{ data: any; error: any; count: number | null }> {
    let url = `${REST_URL}/${this.table}?select=${encodeURIComponent(this.selectColumns)}`;

    const paramStr = this.params.toString();
    if (paramStr) url += `&${paramStr}`;
    if (this.orderCol) url += `&order=${this.orderCol}.${this.orderAsc ? 'asc' : 'desc'}`;
    if (this.limitVal) url += `&limit=${this.limitVal}`;

    const reqHeaders: Record<string, string> = { ...headers };
    if (this.countMode) reqHeaders['Prefer'] = `count=${this.countMode},return=representation`;
    if (this.headOnly) reqHeaders['Prefer'] = `count=${this.countMode}`;
    if (this.rangeStart !== null && this.rangeEnd !== null) {
      reqHeaders['Range'] = `${this.rangeStart}-${this.rangeEnd}`;
    }

    const opts: RequestInit = { method: this.headOnly ? 'HEAD' : this.method, headers: reqHeaders };
    if (this.body && this.method !== 'GET') {
      opts.body = JSON.stringify(this.body);
    }

    const response = await fetch(url, opts);
    const countHeader = response.headers.get('content-range');
    let count: number | null = null;
    if (countHeader) {
      const match = countHeader.match(/\/(\d+|\*)/);
      if (match && match[1] !== '*') count = parseInt(match[1]);
    }

    if (!response.ok) {
      const errBody = await response.text();
      let parsed;
      try { parsed = JSON.parse(errBody); } catch { parsed = { message: errBody }; }
      return { data: null, error: { message: parsed.message || `HTTP ${response.status}`, code: String(response.status) }, count: null };
    }

    if (this.headOnly) return { data: null, error: null, count };

    const data = await response.json();
    if (this.singleRow) {
      if (Array.isArray(data) && data.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' }, count };
      }
      return { data: Array.isArray(data) ? data[0] : data, error: null, count };
    }

    return { data, error: null, count };
  }
}
