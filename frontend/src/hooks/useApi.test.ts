import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from './useApi';
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';


// 2025/1/5追記
// mswのimport { http, HttpResponse, delay } from 'msw';を正しく読み込まないためにエラーが出ます
// 解消法がわからないので一旦保留としています。


// jest用のテスト(node.js環境で実行)

// テスト用のベースURLを定義
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

// テスト用のデータ型を定義
interface TestData {
  id: number;
  name: string;
}

// MSWサーバーのセットアップ
const server = setupServer(
  // GETリクエストのハンドラー
  http.get(`${API_BASE_URL}/groups`, async () => {
    await delay(100);
    return HttpResponse.json<TestData>({
      id: 1,
      name: 'test data'
    });
  }),

  // POSTリクエストのハンドラー
  http.post(`${API_BASE_URL}/groups`, async ({ request }) => {
    await delay(100);
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: body
    });
  }),

  // エラーケース用のハンドラー
  http.get(`${API_BASE_URL}/error`, () => {
    return new HttpResponse(null, { status: 500 });
  })
);

describe('useApi', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('データを正常に取得できること', async () => {
    const { result } = renderHook(() => useApi<TestData>(`${API_BASE_URL}/groups`));

    await waitFor(() => {
      expect(result.current.data).toEqual({
        id: 1,
        name: 'test data'
      });
    });

    expect(result.current.error).toBeNull();
  });

});