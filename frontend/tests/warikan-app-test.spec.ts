import { test, expect } from "@playwright/test";
import axios from "axios";

test.describe("割り勘アプリ", () => {
  // 各テストケース実行前の共通設定
  test.beforeEach(async ({ page }) => {
    // localhost:3000/initエンドポイントを呼び出してテストデータを初期化
    await axios.get("http://localhost:3000/init");
    // テスト対象のフロントエンドアプリケーション（localhost:3001）に移動
    await page.goto("http://localhost:3001");
  });

  test.describe("グループ作成", () => {
    // 正常系: グループ作成のテスト
    test("グループが作成され支出登録ページに遷移する", async ({ page }) => {
      // aria-label="グループ名"の要素を取得して入力
      const groupNameInput = page.getByLabel("グループ名");
      await groupNameInput.fill("group1");

      // aria-label="メンバー"の要素を取得して入力
      const memberListInput = page.getByLabel("メンバー");
      await memberListInput.fill("太郎, 花子");

      // buttonロールを持つ要素（送信ボタン）を取得してクリック
      const submitButton = page.getByRole("button");
      await submitButton.click();

      // URLが/group/group1のパターンに一致することを確認
      await expect(page).toHaveURL(/.+\/group\/group1/);
    });

    // 異常系: バリデーションのテスト
    test("バリデーションエラーが存在する場合グループが作成されずページ遷移しない", async ({
      page,
    }) => {
      // 入力せずに送信ボタンをクリック
      const submitButton = page.getByRole("button");
      await submitButton.click();

      // エラーメッセージが表示されることを確認
      await expect(page.getByText("グループ名は必須です")).toBeVisible();
      await expect(page.getByText("メンバーは2人以上必要です")).toBeVisible();
      // 期待したURLパターンに遷移していないことを確認
      await expect(page).not.toHaveURL(/.+\/group\/group1/);
    });
  });

  test.describe("支出登録機能", () => {
    // 支出登録機能の各テスト実行前にグループを作成
    test.beforeEach(async ({ page }) => {
      const groupNameInput = page.getByLabel("グループ名");
      await groupNameInput.fill("group1");
      const memberListInput = page.getByLabel("メンバー");
      await memberListInput.fill("太郎, 花子");

      const submitButton = page.getByRole("button");
      await submitButton.click();
    });

    // 正常系: 支出登録のテスト
    test("支出が登録され清算リストが更新される", async ({ page }) => {
      // 支出情報の入力
      const expenseNameInput = page.getByLabel("支出名");
      await expenseNameInput.fill("ランチ");
      const amountInput = page.getByLabel("金額");
      await amountInput.fill("1000");
      const memberSelect = page.getByLabel("支払うメンバー");
      await memberSelect.selectOption("花子");

      const submitButton = page.getByRole("button");
      await submitButton.click();

      // ページ遷移の確認
      await expect(page).toHaveURL(/.+\/group\/group1/);
      // 清算リストの内容確認
      await expect(page.getByRole("list")).toHaveText("太郎 → 花子500円");
    });

    // 異常系: 支出登録のバリデーションテスト
    test("バリデーションエラーが存在する場合支出が登録されず清算リストが更新されない", async ({ page }) => {
      // 入力せずに送信
      const submitButton = page.getByRole("button");
      await submitButton.click();

      // エラーメッセージの表示確認
      await expect(page.getByText("支出名は必須です")).toBeVisible();
      await expect(page.getByText("金額は1円以上の整数で必須です")).toBeVisible();
      await expect(page.getByText("支払うメンバーは必須です")).toBeVisible();

      // 清算リストが空であることの確認
      await expect(page.getByRole("list")).toHaveText("");
    });
  });
});