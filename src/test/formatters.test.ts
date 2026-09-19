import { describe, it, expect } from 'vitest';
import {
  formatCurrency_LiveFinancialCalculator,
  formatCompactCurrency_LiveFinancialCalculator,
  formatGoldPrice_DashboardScreen,
  formatNetPosition_DashboardScreen,
  formatQuickStatsCurrency_DashboardScreen,
  formatINR,
  formatCompactINR,
} from '../lib/formatters';

describe('Task 7: 1:1 Ported Flutter Dart Formatters', () => {
  describe('formatCurrency_LiveFinancialCalculator (live_financial_calculator.dart lines 33-35)', () => {
    it('formats 15000 into ₹15,000', () => {
      expect(formatCurrency_LiveFinancialCalculator(15000)).toBe('₹15,000');
    });

    it('rounds 99999.6 and formats into ₹100,000', () => {
      expect(formatCurrency_LiveFinancialCalculator(99999.6)).toBe('₹100,000');
    });

    it('formats 0 into ₹0', () => {
      expect(formatCurrency_LiveFinancialCalculator(0)).toBe('₹0');
    });

    it('handles negative numbers with leading minus or regex grouping', () => {
      expect(formatCurrency_LiveFinancialCalculator(-15000)).toBe('₹-15,000');
    });

    it('handles NaN gracefully', () => {
      expect(formatCurrency_LiveFinancialCalculator(NaN)).toBe('₹0');
    });
  });

  describe('formatCompactCurrency_LiveFinancialCalculator (live_financial_calculator.dart lines 37-47)', () => {
    it('formats 100000 (>= 1e5) into ₹1L (whole lakh, no decimals)', () => {
      expect(formatCompactCurrency_LiveFinancialCalculator(100000)).toBe('₹1L');
    });

    it('formats 125000 into ₹1.3L (matches Dart toStringAsFixed(1) rounding on 1.25)', () => {
      expect(formatCompactCurrency_LiveFinancialCalculator(125000)).toBe('₹1.3L');
    });

    it('formats 12000000 (>= 1e7) into ₹1.2Cr (with one decimal)', () => {
      expect(formatCompactCurrency_LiveFinancialCalculator(12000000)).toBe('₹1.2Cr');
    });

    it('formats 20000000 into ₹2Cr (whole crore, no decimal)', () => {
      expect(formatCompactCurrency_LiveFinancialCalculator(20000000)).toBe('₹2Cr');
    });

    it('formats amounts under 1 Lakh using standard grouping (42000 -> ₹42,000)', () => {
      expect(formatCompactCurrency_LiveFinancialCalculator(42000)).toBe('₹42,000');
      expect(formatCompactCurrency_LiveFinancialCalculator(7500)).toBe('₹7,500');
    });

    it('formats 0 into ₹0', () => {
      expect(formatCompactCurrency_LiveFinancialCalculator(0)).toBe('₹0');
    });

    it('handles NaN gracefully', () => {
      expect(formatCompactCurrency_LiveFinancialCalculator(NaN)).toBe('₹0');
    });
  });

  describe('formatGoldPrice_DashboardScreen (dashboard_screen.dart line 1337)', () => {
    it('formats 7850 into ₹7,850 via toStringAsFixed(0) and Western grouping', () => {
      expect(formatGoldPrice_DashboardScreen(7850)).toBe('₹7,850');
      expect(formatGoldPrice_DashboardScreen(7850.45)).toBe('₹7,850');
    });

    it('formats 0 into ₹0', () => {
      expect(formatGoldPrice_DashboardScreen(0)).toBe('₹0');
    });
  });

  describe('formatNetPosition_DashboardScreen (dashboard_screen.dart line 581)', () => {
    it('formats net position amounts with round() and grouping', () => {
      expect(formatNetPosition_DashboardScreen(1280000)).toBe('₹1,280,000');
      expect(formatNetPosition_DashboardScreen(3150000)).toBe('₹3,150,000');
      expect(formatNetPosition_DashboardScreen(0)).toBe('₹0');
    });
  });

  describe('formatQuickStatsCurrency_DashboardScreen (dashboard_screen.dart lines 929-933)', () => {
    it('formats monthly quick stats values correctly', () => {
      expect(formatQuickStatsCurrency_DashboardScreen(120000)).toBe('₹120,000');
      expect(formatQuickStatsCurrency_DashboardScreen(60000)).toBe('₹60,000');
      expect(formatQuickStatsCurrency_DashboardScreen(350000)).toBe('₹350,000');
      expect(formatQuickStatsCurrency_DashboardScreen(20000)).toBe('₹20,000');
    });
  });

  describe('Backward compatibility aliases (formatINR, formatCompactINR)', () => {
    it('formatINR maps to formatCurrency_LiveFinancialCalculator', () => {
      expect(formatINR(15000)).toBe('₹15,000');
      expect(formatINR(0)).toBe('₹0');
    });

    it('formatCompactINR maps to formatCompactCurrency_LiveFinancialCalculator', () => {
      expect(formatCompactINR(100000)).toBe('₹1L');
      expect(formatCompactINR(12000000)).toBe('₹1.2Cr');
    });
  });
});
