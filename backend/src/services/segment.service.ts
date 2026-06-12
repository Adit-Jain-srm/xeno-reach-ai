import { supabase } from '../db/supabase.js';
import type { FilterConfig, FilterCondition } from '../../../shared/types.js';

export async function listSegments() {
  const { data, error } = await supabase
    .from('segments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSegment(id: string) {
  const { data, error } = await supabase
    .from('segments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createSegment(segmentData: {
  name: string;
  description?: string;
  filter_config: FilterConfig;
  natural_language_query?: string;
}) {
  const sql = buildFilterSQL(segmentData.filter_config);
  const count = await getAudienceCount(segmentData.filter_config);

  const { data, error } = await supabase
    .from('segments')
    .insert({
      ...segmentData,
      filter_config: segmentData.filter_config,
      generated_sql: sql,
      customer_count: count,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function previewSegment(filterConfig: FilterConfig) {
  const count = await getAudienceCount(filterConfig);
  const sample = await getAudienceSample(filterConfig, 10);

  return { count, sample };
}

export async function getSegmentCustomers(segmentId: string, page = 1, pageSize = 20) {
  const segment = await getSegment(segmentId);
  if (!segment) throw new Error('Segment not found');

  const filterConfig = segment.filter_config as FilterConfig;
  return queryCustomersByFilter(filterConfig, page, pageSize);
}

export async function getAudienceCount(filterConfig: FilterConfig): Promise<number> {
  let query = supabase.from('customers').select('id', { count: 'exact', head: true });
  query = applyFilters(query, filterConfig);

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function getAudienceSample(filterConfig: FilterConfig, limit: number) {
  let query = supabase.from('customers').select('id, name, email, city, loyalty_tier, total_spent, engagement_score');
  query = applyFilters(query, filterConfig);
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function queryCustomersByFilter(filterConfig: FilterConfig, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  let query = supabase.from('customers').select('*', { count: 'exact' });
  query = applyFilters(query, filterConfig);
  query = query.range(offset, offset + pageSize - 1);
  query = query.order('engagement_score', { ascending: false });

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    page_size: pageSize,
    total_pages: Math.ceil((count || 0) / pageSize),
  };
}

function applyFilters(query: any, filterConfig: FilterConfig): any {
  const { conditions, logic } = filterConfig;

  if (!conditions || conditions.length === 0) return query;

  if (logic === 'OR') {
    const orClauses = conditions.map(c => buildOrClause(c)).filter(Boolean);
    if (orClauses.length > 0) {
      query = query.or(orClauses.join(','));
    }
  } else {
    for (const condition of conditions) {
      query = applyCondition(query, condition);
    }
  }

  return query;
}

function applyCondition(query: any, condition: FilterCondition): any {
  const { field, operator, value } = condition;

  switch (operator) {
    case 'eq': return query.eq(field, value);
    case 'neq': return query.neq(field, value);
    case 'gt': return query.gt(field, value);
    case 'gte': return query.gte(field, value);
    case 'lt': return query.lt(field, value);
    case 'lte': return query.lte(field, value);
    case 'in': return query.in(field, Array.isArray(value) ? value : [value]);
    case 'contains': return query.ilike(field, `%${value}%`);
    case 'between': {
      const [min, max] = value as [any, any];
      return query.gte(field, min).lte(field, max);
    }
    default: return query;
  }
}

function buildOrClause(condition: FilterCondition): string {
  const { field, operator, value } = condition;
  switch (operator) {
    case 'eq': return `${field}.eq.${value}`;
    case 'neq': return `${field}.neq.${value}`;
    case 'gt': return `${field}.gt.${value}`;
    case 'gte': return `${field}.gte.${value}`;
    case 'lt': return `${field}.lt.${value}`;
    case 'lte': return `${field}.lte.${value}`;
    case 'contains': return `${field}.ilike.%${value}%`;
    default: return '';
  }
}

export function buildFilterSQL(filterConfig: FilterConfig): string {
  const { conditions, logic } = filterConfig;
  if (!conditions || conditions.length === 0) return 'SELECT * FROM customers';

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  };

  const clauses = conditions.map(c => {
    const { field, operator, value } = c;
    const safeField = field.replace(/[^a-z_]/gi, '');
    switch (operator) {
      case 'eq': return `${safeField} = ${escape(value)}`;
      case 'neq': return `${safeField} != ${escape(value)}`;
      case 'gt': return `${safeField} > ${escape(value)}`;
      case 'gte': return `${safeField} >= ${escape(value)}`;
      case 'lt': return `${safeField} < ${escape(value)}`;
      case 'lte': return `${safeField} <= ${escape(value)}`;
      case 'in': {
        const vals = Array.isArray(value) ? value.map(v => escape(v)).join(',') : escape(value);
        return `${safeField} IN (${vals})`;
      }
      case 'contains': return `${safeField} ILIKE ${escape(`%${value}%`)}`;
      case 'between': {
        const [min, max] = value as [unknown, unknown];
        return `${safeField} BETWEEN ${escape(min)} AND ${escape(max)}`;
      }
      default: return '1=1';
    }
  });

  const joinOp = logic === 'OR' ? ' OR ' : ' AND ';
  return `SELECT * FROM customers WHERE ${clauses.join(joinOp)}`;
}
