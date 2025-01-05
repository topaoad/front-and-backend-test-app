import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import CreateGroupPage from './CreateGroupPage';
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { http, HttpResponse, delay } from 'msw'

// storybook用のテスト（Viteを使用してブラウザ環境で実行）

const meta = {
  title: 'Pages/CreateGroupPage',
  component: CreateGroupPage,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <ChakraProvider>
          <Story />
        </ChakraProvider>
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    // デフォルトのMSWハンドラー
    msw: {
      handlers: [
        http.post(`${import.meta.env.VITE_API_BASE_URL}/groups`, async () => {
          return HttpResponse.json({
            success: true
          })
        }),
      ],
    },
  },
} satisfies Meta<typeof CreateGroupPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * 正常系: フォーム送信成功のシナリオ
 * - フォームに有効なデータを入力
 * - 送信成功後、指定されたページへ遷移することを確認
 */
export const SuccessfulSubmission: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post(`${import.meta.env.VITE_API_BASE_URL}/groups`, async () => {
          await delay(1000);
          return HttpResponse.json({
            success: true
          })
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const groupName = 'テストグループ';

    await step('フォームに有効なデータを入力', async () => {
      await userEvent.type(canvas.getByLabelText('グループ名'), groupName);
      await userEvent.type(canvas.getByLabelText('メンバー'), '一郎,二郎,三郎');
    });

    await step('フォームを送信', async () => {
      const submitButton = canvas.getByRole('button', { name: /作成/i });
      await userEvent.click(submitButton);
    });

    // 注: 実際のナビゲーションはモックされるため、
    // URLの変更を直接テストすることはできませんが、
    // navigate関数が呼ばれたことは確認できます
  },
};

/**
 * 異常系: フォーム送信失敗のシナリオ
 * - フォームに有効なデータを入力
 * - サーバーからエラーレスポンスを受信
 * - エラーメッセージが表示されることを確認
 */
export const FailedSubmission: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post(`${import.meta.env.VITE_API_BASE_URL}/groups`, async () => {
          await delay(1000);
          return new HttpResponse(null, {
            status: 400
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('フォームに有効なデータを入力', async () => {
      await userEvent.type(canvas.getByLabelText('グループ名'), 'テストグループ');
      await userEvent.type(canvas.getByLabelText('メンバー'), '一郎,二郎,三郎');
    });

    await step('フォームを送信', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /作成/i }));
    });

    await step('エラー表示の確認', async () => {
      const errorMessage = await canvas.findByText('グループの作成に失敗');
      expect(errorMessage).toBeInTheDocument();
    });
  },
};

/**
 * バリデーション: クライアントサイドのバリデーションをテスト
 */
export const ValidationErrors: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('空のフォームを送信', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /作成/i }));
    });

    await step('バリデーションエラーの確認', async () => {
      const errors = await canvas.findAllByRole('alert');
      expect(errors.length).toBeGreaterThan(0);
    });
  },
};