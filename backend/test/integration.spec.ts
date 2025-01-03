import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { Group } from '../src/type';
import { createApp } from '../src/app';
import { Express } from 'express';

describe('Group API Integration Tests', () => {
  const GROUP_FILE = "../data/integration/groups.json"
  const EXPENSE_FILE = "../data/integration/expenses.json"

  let app: Express;

  beforeAll(() => {
    // アプリケーションの初期化
    process.env.NODE_ENV = 'test';
    app = createApp(GROUP_FILE, EXPENSE_FILE);
  });

  beforeEach(() => {
    // 各テスト前にグループデータを初期化
    fs.writeFileSync(GROUP_FILE, JSON.stringify([]));
  });

  describe('グループ管理 API', () => {
    it('新しいグループを作成できる', async () => {
      const newGroup: Group = {
        name: "テストグループ1",
        members: ["一郎", "二郎", "三郎"]
      };

      const response = await request(app)
        .post('/groups')
        .send(newGroup)
        .expect(200);

      // レスポンスの検証
      expect(response.text).toBe('グループの作成が成功しました');

      // ファイルに正しく保存されているか確認
      const savedGroups = JSON.parse(fs.readFileSync(GROUP_FILE, 'utf8'));
      expect(savedGroups).toContainEqual(newGroup);
    });

    it('グループ一覧を取得できる', async () => {
      // テストデータの準備
      const testGroups: Group[] = [
        { name: "テストグループ1", members: ["一郎", "二郎", "三郎"] },
        { name: "テストグループ2", members: ["四郎", "五郎"] }
      ];

      fs.writeFileSync(GROUP_FILE, JSON.stringify(testGroups));

      // グループ一覧の取得
      const response = await request(app)
        .get('/groups')
        .expect(200);

      // レスポンスの検証
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(expect.arrayContaining(testGroups));
    });
  });
});