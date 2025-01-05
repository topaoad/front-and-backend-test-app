import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import CreateGroupForm from './CreateGroupForm';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';

describe('CreateGroupForm', () => {
  const mockOnSubmit = jest.fn().mockImplementation(() => Promise.resolve());
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

  beforeEach(() => {
    mockOnSubmit.mockClear();
    consoleSpy.mockClear();
    alertSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('renders form elements correctly', () => {
    render(
      <ChakraProvider>
        <CreateGroupForm onSubmit={mockOnSubmit} />
      </ChakraProvider>
    );

    expect(screen.getByLabelText(/グループ名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/メンバー/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /グループを作成/i })).toBeInTheDocument();
  });

  it('submits form data successfully', async () => {
    const user = userEvent.setup();
    render(
      <ChakraProvider>
        <CreateGroupForm onSubmit={mockOnSubmit} />
      </ChakraProvider>
    );

    const nameInput = screen.getByLabelText(/グループ名/i);
    const membersInput = screen.getByLabelText(/メンバー/i);
    const submitButton = screen.getByRole('button', { name: /グループを作成/i });

    await act(async () => {
      await user.type(nameInput, '旅行グループ');
      await user.type(membersInput, '太郎, 花子');
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: '旅行グループ',
        members: ['太郎', '花子'],
      });
    });
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();

    render(
      <ChakraProvider>
        <CreateGroupForm onSubmit={mockOnSubmit} />
      </ChakraProvider>
    );

    const submitButton = screen.getByRole('button', { name: /グループを作成/i });

    await act(async () => {
      await user.click(submitButton);
    });

    // Chakra UIのFormErrorMessageの構造に合わせてテストを修正
    await waitFor(() => {
      // aria-live="polite"を持つエラーメッセージ要素を検索
      const errorMessages = screen.getAllByText((_, element) => {
        return element?.classList.contains('chakra-form__error-message') ?? false;
      });

      // 2つのエラーメッセージが存在することを確認
      expect(errorMessages).toHaveLength(2);

      // グループ名のエラーメッセージを確認
      expect(screen.getByText('グループ名は必須です')).toBeInTheDocument();

      // メンバーのエラーメッセージを確認
      expect(screen.getByText('メンバーは2人以上必要です')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles submission error correctly', async () => {
    const mockErrorSubmit = jest.fn().mockRejectedValue(new Error('登録に失敗'));
    const user = userEvent.setup();

    render(
      <ChakraProvider>
        <CreateGroupForm onSubmit={mockErrorSubmit} />
      </ChakraProvider>
    );

    const nameInput = screen.getByLabelText(/グループ名/i);
    const membersInput = screen.getByLabelText(/メンバー/i);
    const submitButton = screen.getByRole('button', { name: /グループを作成/i });

    await act(async () => {
      await user.type(nameInput, '旅行グループ');
      await user.type(membersInput, '太郎, 花子');
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('登録に失敗');
    });
  });

  it('shows loading state during submission', async () => {
    const mockSubmitWithDelay = jest.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    );
    const user = userEvent.setup();

    render(
      <ChakraProvider>
        <CreateGroupForm onSubmit={mockSubmitWithDelay} />
      </ChakraProvider>
    );

    const nameInput = screen.getByLabelText(/グループ名/i);
    const membersInput = screen.getByLabelText(/メンバー/i);
    const submitButton = screen.getByRole('button', { name: /グループを作成/i });

    await act(async () => {
      await user.type(nameInput, '旅行グループ');
      await user.type(membersInput, '太郎, 花子');
      await user.click(submitButton);
    });

    expect(submitButton).toBeDisabled();
  });
});