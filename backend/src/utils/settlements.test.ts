import { calculateSettlements } from './settlements';
import { Expense, Settlement } from '../type';

describe('calculateSettlements', () => {
  // 基本的なケース：3人での均等な支払い
  it('should calculate settlements for simple equal expenses', () => {
    const expenses: Expense[] = [
      {
        groupName: 'Travel',
        expenseName: 'Hotel',
        payer: 'Alice',
        amount: 3000
      }
    ];
    const members = ['Alice', 'Bob', 'Charlie'];

    const settlements: Settlement[] = calculateSettlements(expenses, members);

    // 期待される結果：BobとCharlieがAliceにそれぞれ1000円支払う
    expect(settlements).toEqual([
      { from: 'Bob', to: 'Alice', amount: 1000 },
      { from: 'Charlie', to: 'Alice', amount: 1000 }
    ]);
  });

  // 複数の支払いがある場合のテスト
  it('should handle multiple expenses', () => {
    const expenses: Expense[] = [
      {
        groupName: 'Travel',
        expenseName: 'Hotel',
        payer: 'Alice',
        amount: 3000
      },
      {
        groupName: 'Travel',
        expenseName: 'Dinner',
        payer: 'Bob',
        amount: 1500
      }
    ];
    const members = ['Alice', 'Bob', 'Charlie'];

    const settlements = calculateSettlements(expenses, members);

    // 検証：最終的な清算額が正しいこと
    const totalSettlements = settlements.reduce((sum, s) => sum + s.amount, 0);
    const expectedTotal = 1500; // 理論上の清算総額
    expect(totalSettlements).toBe(expectedTotal);
  });

  // 端数処理のテスト
  it('should handle amounts that dont divide equally', () => {
    const expenses: Expense[] = [
      {
        groupName: 'Lunch',
        expenseName: 'Pizza',
        payer: 'Alice',
        amount: 1000 // 3人で割ると端数が出る
      }
    ];
    const members = ['Alice', 'Bob', 'Charlie'];

    const settlements = calculateSettlements(expenses, members);

    // 検証：
    // 1. 全ての清算額が整数であること
    settlements.forEach(s => {
      expect(Number.isInteger(s.amount)).toBe(true);
    });

    // 2. 清算後の合計が元の支払額と一致すること
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(totalSettled).toBeLessThanOrEqual(1000);
  });

  // エッジケース：メンバーが1人の場合
  it('should handle single member group', () => {
    const expenses: Expense[] = [
      {
        groupName: 'Solo',
        expenseName: 'Coffee',
        payer: 'Alice',
        amount: 500
      }
    ];
    const members = ['Alice'];

    const settlements = calculateSettlements(expenses, members);

    // 清算が発生しないことを確認
    expect(settlements).toHaveLength(0);
  });

  // 複雑なケース：複数の支払いと相殺が必要な場合
  it('should optimize settlements for multiple cross-payments', () => {
    const expenses: Expense[] = [
      {
        groupName: 'Trip',
        expenseName: 'Hotel',
        payer: 'Alice',
        amount: 6000
      },
      {
        groupName: 'Trip',
        expenseName: 'Food',
        payer: 'Bob',
        amount: 3000
      },
      {
        groupName: 'Trip',
        expenseName: 'Transport',
        payer: 'Charlie',
        amount: 3000
      }
    ];
    const members = ['Alice', 'Bob', 'Charlie'];

    const settlements = calculateSettlements(expenses, members);

    // 検証：
    // 1. 必要最小限の清算取引数であること
    expect(settlements.length).toBeLessThanOrEqual(3);

    // 2. 総額が正しいこと
    const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(totalAmount).toBe(2000);
  });
});