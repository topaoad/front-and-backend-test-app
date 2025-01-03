import { Request, Response, NextFunction } from 'express';
import { GroupController } from './groupController';
import { GroupService } from '../services/groupService';
import { Group } from '../type';

/**
 * GroupControllerのテストスイート
 * コントローラーはHTTPリクエストの処理、入力のバリデーション、
 * サービス層の呼び出し、適切なレスポンスの返却を担当
 */
describe('GroupController', () => {
  // テストで使用する変数の型定義
  let groupController: GroupController;
  let mockGroupService: jest.Mocked<GroupService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  // 各テストケース実行前の共通セットアップ
  beforeEach(() => {
    // GroupServiceの各メソッドをモック化
    mockGroupService = {
      getGroups: jest.fn(),
      getGroupByName: jest.fn(),
      addGroup: jest.fn(),
    } as any;

    // テスト対象のコントローラーインスタンスを作成
    groupController = new GroupController(mockGroupService);

    // Expressのリクエストオブジェクトをモック化
    // params: URLパラメータ
    // body: リクエストボディ
    mockRequest = {
      params: {},
      body: {},
    };

    // Expressのレスポンスオブジェクトをモック化
    // status: HTTPステータスコードの設定
    // json: JSONレスポンスの送信
    // send: テキストレスポンスの送信
    mockResponse = {
      // statusメソッドはチェーンメソッドのためthisを返す
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    // エラーハンドリング用のnext関数をモック化
    mockNext = jest.fn();
  });

  /**
   * getGroupList メソッドのテストグループ
   * 全グループの一覧を取得するエンドポイントのテスト
   */
  describe('getGroupList', () => {
    // 正常系: グループ一覧の取得が成功するケース
    it('should return all groups with status 200', () => {
      // モックデータの準備
      const mockGroups: Group[] = [
        { name: 'Group1', members: ['Alice', 'Bob'] },
        { name: 'Group2', members: ['Charlie', 'Dave'] }
      ];
      // getGroupsメソッドが mockGroups を返すように設定
      mockGroupService.getGroups.mockReturnValue(mockGroups);

      // テスト対象メソッドの実行
      groupController.getGroupList(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // レスポンスの検証
      // 1. ステータスコードが200であること
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      // 2. JSONレスポンスが正しいデータを含むこと
      expect(mockResponse.json).toHaveBeenCalledWith(mockGroups);
    });

    // 異常系: エラーが発生するケース
    it('should handle errors using next', () => {
      // データベースエラーなどを想定
      const error = new Error('Database error');
      // getGroupsメソッドがエラーをスローするように設定
      mockGroupService.getGroups.mockImplementation(() => {
        throw error;
      });

      groupController.getGroupList(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // エラーハンドリングの検証
      // エラーがnext関数に正しく渡されることを確認
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  /**
   * getGroupByName メソッドのテストグループ
   * 特定のグループを名前で検索するエンドポイントのテスト
   */
  describe('getGroupByName', () => {
    // 正常系: グループが見つかるケース
    it('should return group when found', () => {
      // テストデータとパラメータの準備
      const mockGroup: Group = { name: 'Group1', members: ['Alice', 'Bob'] };
      mockRequest.params = { name: 'Group1' };
      // getGroupByNameメソッドが mockGroup を返すように設定
      mockGroupService.getGroupByName.mockReturnValue(mockGroup);

      groupController.getGroupByName(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // レスポンスの検証
      // 1. ステータスコードが200であること
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      // 2. 正しいグループデータが返されること
      expect(mockResponse.json).toHaveBeenCalledWith(mockGroup);
    });

    // 異常系: グループが見つからないケース
    it('should return 404 when group not found', () => {
      mockRequest.params = { name: 'NonExistentGroup' };
      // グループが見つからない場合はundefinedを返すように設定
      mockGroupService.getGroupByName.mockReturnValue(undefined);

      groupController.getGroupByName(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // レスポンスの検証
      // 1. ステータスコードが404であること
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      // 2. 適切なエラーメッセージが返されること
      expect(mockResponse.send).toHaveBeenCalledWith('グループが存在しません');
    });
  });

  /**
   * addGroup メソッドのテストグループ
   * 新規グループを作成するエンドポイントのテスト
   */
  describe('addGroup', () => {
    // 正常系: 新規グループの作成が成功するケース
    it('should add new group successfully', () => {
      // 有効なグループデータの準備
      const newGroup: Group = {
        name: 'NewGroup',
        members: ['Alice', 'Bob']
      };
      mockRequest.body = newGroup;
      // 既存のグループが存在しないことを想定
      mockGroupService.getGroups.mockReturnValue([]);

      groupController.addGroup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // 処理の検証
      // 1. グループが正しく追加されたこと
      expect(mockGroupService.addGroup).toHaveBeenCalledWith(newGroup);
      // 2. 適切なレスポンスが返されること
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('グループの作成が成功しました');
    });

    // 異常系: グループ名の重複があるケース
    it('should return 400 when group name already exists', () => {
      // 既存のグループデータ
      const existingGroup: Group = {
        name: 'ExistingGroup',
        members: ['Alice', 'Bob']
      };
      mockRequest.body = existingGroup;
      // 同名のグループが既に存在する状況を設定
      mockGroupService.getGroups.mockReturnValue([existingGroup]);

      groupController.addGroup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // レスポンスの検証
      // 1. ステータスコードが400であること
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      // 2. 適切なエラーメッセージが返されること
      expect(mockResponse.send).toHaveBeenCalledWith('同じ名前のグループが登録されています');
    });

    // 異常系: バリデーションエラーのケース
    it('should handle validation errors', () => {
      // 不正なグループデータ（membersが配列でない）
      mockRequest.body = {
        name: 'InvalidGroup',
        members: 'not an array' // 意図的に不正なデータ型を使用
      };

      groupController.addGroup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // バリデーションエラーの検証
      // 1. ステータスコードが400であること
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      // 2. Zodのバリデーションエラーメッセージが返されること
    });

    // 異常系: 予期せぬエラーのケース
    it('should handle unexpected errors using next', () => {
      // 予期せぬエラーの設定
      const error = new Error('Unexpected error');
      mockGroupService.getGroups.mockImplementation(() => {
        throw error;
      });

      // 有効なリクエストデータ
      mockRequest.body = {
        name: 'NewGroup',
        members: ['Alice', 'Bob']
      };

      groupController.addGroup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // エラーハンドリングの検証
      // エラーが next ミドルウェアに正しく渡されることを確認
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});