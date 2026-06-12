import { describe, it, expect } from 'vitest';
import { buildFilterSQL } from '../../backend/src/services/segment.service.js';

describe('Segment Engine', () => {
  describe('buildFilterSQL', () => {
    it('generates SQL for single eq condition', () => {
      const sql = buildFilterSQL({
        conditions: [{ field: 'city', operator: 'eq', value: 'Mumbai' }],
        logic: 'AND',
      });
      expect(sql).toContain("city = 'Mumbai'");
      expect(sql).toContain('SELECT * FROM customers WHERE');
    });

    it('generates SQL for multiple AND conditions', () => {
      const sql = buildFilterSQL({
        conditions: [
          { field: 'loyalty_tier', operator: 'eq', value: 'gold' },
          { field: 'total_spent', operator: 'gt', value: 5000 },
        ],
        logic: 'AND',
      });
      expect(sql).toContain("loyalty_tier = 'gold'");
      expect(sql).toContain("total_spent > 5000");
      expect(sql).toContain(' AND ');
    });

    it('generates SQL for OR conditions', () => {
      const sql = buildFilterSQL({
        conditions: [
          { field: 'city', operator: 'eq', value: 'Mumbai' },
          { field: 'city', operator: 'eq', value: 'Delhi' },
        ],
        logic: 'OR',
      });
      expect(sql).toContain(' OR ');
    });

    it('generates SQL for IN operator', () => {
      const sql = buildFilterSQL({
        conditions: [{ field: 'loyalty_tier', operator: 'in', value: ['gold', 'platinum'] }],
        logic: 'AND',
      });
      expect(sql).toContain("IN ('gold','platinum')");
    });

    it('generates SQL for contains/ILIKE operator', () => {
      const sql = buildFilterSQL({
        conditions: [{ field: 'name', operator: 'contains', value: 'Sharma' }],
        logic: 'AND',
      });
      expect(sql).toContain("ILIKE '%Sharma%'");
    });

    it('generates SQL for between operator', () => {
      const sql = buildFilterSQL({
        conditions: [{ field: 'total_spent', operator: 'between', value: [1000, 5000] }],
        logic: 'AND',
      });
      expect(sql).toContain('BETWEEN');
      expect(sql).toContain('1000');
      expect(sql).toContain('5000');
    });

    it('returns generic SELECT for empty conditions', () => {
      const sql = buildFilterSQL({ conditions: [], logic: 'AND' });
      expect(sql).toBe('SELECT * FROM customers');
    });

    it('sanitizes field names against SQL injection', () => {
      const sql = buildFilterSQL({
        conditions: [{ field: 'city; DROP TABLE customers; --', operator: 'eq', value: 'test' }],
        logic: 'AND',
      });
      expect(sql).not.toContain('DROP TABLE');
      expect(sql).not.toContain(';');
    });

    it('escapes single quotes in values', () => {
      const sql = buildFilterSQL({
        conditions: [{ field: 'name', operator: 'eq', value: "O'Brien" }],
        logic: 'AND',
      });
      expect(sql).toContain("O''Brien");
    });
  });
});
