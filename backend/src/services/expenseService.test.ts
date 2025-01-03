import { ExpenseService } from './expenseService';
import { GroupService } from './groupService';
import { ExpenseRepository } from '../repositories/expenseRepository';
import { GroupRepository } from '../repositories/groupRepository';
import { Group, Expense, Settlement } from '../type';
import { calculateSettlements } from '../utils/settlements';

// ******************** GroupServiceのテスト ********************
describe('GroupService', () => {
  let groupService: GroupService;
  let mockGroupRepository: jest.Mocked<GroupRepository>;

  // 各テストケース実行前の共通セットアップ
  beforeEach(() => {
    // GroupRepositoryのモックを作成し、必要なメソッドをjest.fn()で置き換え
    mockGroupRepository = {
      loadGroups: jest.fn(),
      saveGroup: jest.fn(),
    } as any;

    // テスト対象のGroupServiceインスタンスを作成
    groupService = new GroupService(mockGroupRepository);
  });

  // getGroupsメソッドのテストグループ
  describe('getGroups', () => {
    // 正常系：全グループの取得
    it('should return all groups', () => {
      // テストデータの準備
      const mockGroups: Group[] = [
        { name: 'Group1', members: ['Alice', 'Bob'] },
        { name: 'Group2', members: ['Charlie', 'Dave'] }
      ];

      // リポジトリのモックが特定の値を返すように設定
      mockGroupRepository.loadGroups.mockReturnValue(mockGroups);

      // テスト対象メソッドの実行
      const result = groupService.getGroups();

      // 検証
      // 1. 返値が期待通りのグループ一覧であること
      expect(result).toEqual(mockGroups);
      // 2. リポジトリのloadGroupsメソッドが呼び出されたこと
      expect(mockGroupRepository.loadGroups).toHaveBeenCalled();
    });
  });

  // getGroupByNameメソッドのテストグループ
  describe('getGroupByName', () => {
    // 正常系：存在するグループの取得
    it('should return group when it exists', () => {
      const mockGroups: Group[] = [
        { name: 'Group1', members: ['Alice', 'Bob'] },
        { name: 'Group2', members: ['Charlie', 'Dave'] }
      ];
      mockGroupRepository.loadGroups.mockReturnValue(mockGroups);

      // 特定のグループ名で検索
      const result = groupService.getGroupByName('Group1');

      // 検証：期待通りのグループが返されること
      expect(result).toEqual(mockGroups[0]);
    });

    // 異常系：存在しないグループの検索
    it('should return undefined when group does not exist', () => {
      // 空のグループリストを返すようにモック設定
      mockGroupRepository.loadGroups.mockReturnValue([]);

      const result = groupService.getGroupByName('NonexistentGroup');

      // 検証：undefinedが返されること
      expect(result).toBeUndefined();
    });
  });

  // addGroupメソッドのテストグループ
  describe('addGroup', () => {
    // 正常系：新規グループの追加
    it('should save new group', () => {
      const newGroup: Group = {
        name: 'NewGroup',
        members: ['Alice', 'Bob']
      };

      // グループの追加を実行
      groupService.addGroup(newGroup);

      // 検証：リポジトリのsaveGroupメソッドが正しい引数で呼び出されたこと
      expect(mockGroupRepository.saveGroup).toHaveBeenCalledWith(newGroup);
    });
  });
});

// ******************** ExpenseServiceのテスト ********************
describe('ExpenseService', () => {
  let 
  expenseService: ExpenseService;
  let mockExpenseRepository: jest.Mocked<ExpenseRepository>;
  let mockGroupService: jest.Mocked<GroupService>;

  beforeEach(() => {
    // ExpenseRepositoryのモックを作成
    mockExpenseRepository = {
      loadExpenses: jest.fn(),
      saveExpense: jest.fn(),
    } as any;

    // GroupServiceのモックを作成
    mockGroupService = {
      getGroupByName: jest.fn(),
    } as any;

    // テスト対象のExpenseServiceインスタンスを作成
    expenseService = new ExpenseService(mockExpenseRepository, mockGroupService);
  });

  // getSettlementsメソッドのテストグループ
  describe('getSettlements', () => {
    // 正常系：有効なグループの清算計算
    it('should calculate settlements for valid group', () => {
      const groupName = 'TestGroup';
      const mockGroup: Group = {
        name: groupName,
        members: ['Alice', 'Bob', 'Charlie']
      };
      const mockExpenses: Expense[] = [
        {
          groupName,
          expenseName: 'Dinner',
          payer: 'Alice',
          amount: 3000
        }
      ];

      // モックの戻り値を設定
      mockGroupService.getGroupByName.mockReturnValue(mockGroup);
      mockExpenseRepository.loadExpenses.mockReturnValue(mockExpenses);

      const result = expenseService.getSettlements(groupName);

      // 検証
      // 1. 清算結果が正しく計算されていること
      expect(result).toEqual(calculateSettlements(mockExpenses, mockGroup.members));
      // 2. グループ検索が実行されたこと
      expect(mockGroupService.getGroupByName).toHaveBeenCalledWith(groupName);
      // 3. 支出データの取得が実行されたこと
      expect(mockExpenseRepository.loadExpenses).toHaveBeenCalled();
    });

    // 異常系：存在しないグループの清算計算
    it('should throw error for non-existent group', () => {
      const groupName = 'NonexistentGroup';

      // グループが存在しないケースをシミュレート
      mockGroupService.getGroupByName.mockReturnValue(undefined);

      // エラーがスローされることを検証
      expect(() => expenseService.getSettlements(groupName))
        .toThrow(`グループ： ${groupName} が存在しません`);
    });
  });

  // addExpenseメソッドのテストグループ
  describe('addExpense', () => {
    // 正常系：有効な支出の追加
    it('should save valid expense', () => {
      // テストデータの準備
      const mockGroup: Group = {
        name: 'TestGroup',
        members: ['Alice', 'Bob']
      };
      const newExpense: Expense = {
        groupName: 'TestGroup',
        expenseName: 'Lunch',
        payer: 'Alice',
        amount: 2000
      };

      // グループが存在するケースをシミュレート
      mockGroupService.getGroupByName.mockReturnValue(mockGroup);

      // 支出の追加を実行
      expenseService.addExpense(newExpense);

      // 検証：支出が正しく保存されたこと
      expect(mockExpenseRepository.saveExpense).toHaveBeenCalledWith(newExpense);
    });

    // 異常系：存在しないグループへの支出追加
    it('should throw error when group does not exist', () => {
      const newExpense: Expense = {
        groupName: 'NonexistentGroup',
        expenseName: 'Lunch',
        payer: 'Alice',
        amount: 2000
      };

      // グループが存在しないケースをシミュレート
      mockGroupService.getGroupByName.mockReturnValue(undefined);

      // エラーがスローされることを検証
      expect(() => expenseService.addExpense(newExpense))
        .toThrow(`グループ： ${newExpense.groupName} が存在しません`);
    });

    // 異常系：グループメンバーでない支払者による支出追加
    it('should throw error when payer is not a group member', () => {
      const mockGroup: Group = {
        name: 'TestGroup',
        members: ['Alice', 'Bob']
      };
      const newExpense: Expense = {
        groupName: 'TestGroup',
        expenseName: 'Lunch',
        payer: 'Charlie', // メンバーではない
        amount: 2000
      };

      // グループは存在するが、支払者がメンバーでないケースをシミュレート
      mockGroupService.getGroupByName.mockReturnValue(mockGroup);

      // エラーがスローされることを検証
      expect(() => expenseService.addExpense(newExpense))
        .toThrow('支払い者がメンバーの中にいません');
    });
  });
});