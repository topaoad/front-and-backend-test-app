import fs from 'fs';
import { GroupRepository } from './groupRepository';
import { Group } from '../type';

// fsモジュール全体をモック化
// これにより、実際のファイルシステムを使用せずにテストが可能になる
jest.mock('fs');

describe('GroupRepository', () => {
  // テスト用のファイルパスを設定
  const testFilePath = 'test-groups.json';
  let repository: GroupRepository;

  // 各テストケース実行前の共通セットアップ
  beforeEach(() => {
    // テストごとに新しいリポジトリインスタンスを作成
    repository = new GroupRepository(testFilePath);
    // 前のテストで設定されたfsモジュールのモック状態をクリア
    jest.clearAllMocks();
  });

  // loadGroups メソッドのテストグループ
  describe('loadGroups', () => {
    // テストケース1: ファイルが存在しない場合
    it('should return empty array when file does not exist', () => {
      // ファイルが存在しないケースをシミュレート
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = repository.loadGroups();

      // 期待される動作の検証
      // 1. 空配列が返されること
      expect(result).toEqual([]);
      // 2. 正しいファイルパスでfs.existsSyncが呼ばれたこと
      expect(fs.existsSync).toHaveBeenCalledWith(testFilePath);
    });

    // テストケース2: ファイルからグループデータを正常に読み込む場合
    it('should load and parse groups from file', () => {
      // テスト用のグループデータを定義
      const mockGroups: Group[] = [
        { name: 'Group 1', members: ['一郎', '二郎', '三郎'] },
        { name: 'Group 2', members: ['四郎', '五郎'] }
      ];

      // ファイルが存在し、正常なJSONデータが読み込めるケースをシミュレート
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockGroups));

      const result = repository.loadGroups();

      // 期待される動作の検証
      // 1. モックデータと同じ内容が返されること
      expect(result).toEqual(mockGroups);
      // 2. 正しいファイルパスとエンコーディングでファイル操作が行われたこと
      expect(fs.existsSync).toHaveBeenCalledWith(testFilePath);
      expect(fs.readFileSync).toHaveBeenCalledWith(testFilePath, 'utf8');
    });

    // テストケース3: JSONパースエラーのハンドリング
    it('should handle JSON parse errors', () => {
      // 不正なJSONデータを含むファイルの存在をシミュレート
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      // JSON.parseでエラーが発生することを確認
      expect(() => repository.loadGroups()).toThrow();
    });
  });

  // saveGroup メソッドのテストグループ
  describe('saveGroup', () => {
    // テストケース1: 既存のファイルに新しいグループを追加する場合
    it('should save group to file', () => {
      // 既存のグループデータを定義
      const existingGroups: Group[] = [
        { name: 'Group 1', members: ['一郎', '二郎', '三郎'] },
        { name: 'Group 2', members: ['四郎', '五郎'] }
      ];
      // 新しく追加するグループを定義
      const newGroup: Group = { name: 'Group 3', members: ['六郎', '七郎'] };

      // 既存のグループデータが読み込めるケースをシミュレート
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(existingGroups));

      repository.saveGroup(newGroup);

      // ファイル保存の検証
      // 既存のグループと新しいグループが結合されて保存されることを確認
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testFilePath,
        JSON.stringify([...existingGroups, newGroup])
      );
    });

    // テストケース2: ファイルが存在しない場合の新規作成
    it('should create new file with group when file does not exist', () => {
      // 新規作成するグループを定義
      const newGroup: Group = { name: 'Group 1', members: ['一郎', '二郎', '三郎'] };

      // ファイルが存在しないケースをシミュレート
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      repository.saveGroup(newGroup);

      // ファイル保存の検証
      // 新しいグループのみを含む配列が保存されることを確認
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testFilePath,
        JSON.stringify([newGroup])
      );
    });
  });
});