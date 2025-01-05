import type { Meta, StoryObj } from '@storybook/react';
import SettlementList from './SettlementList';
import { Settlement } from "../../type";

const meta = {
  title: 'Components/SettlementList',
  component: SettlementList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SettlementList>;

export default meta;
type Story = StoryObj<typeof meta>;

// サンプルデータ
const sampleSettlements: Settlement[] = [
  {
    from: "二郎",
    to: "一郎",
    amount: 1000
  },
  {
    from: "三郎",
    to: "一郎",
    amount: 2000
  }
];

// デフォルトの表示
export const Default: Story = {
  args: {
    settlements: sampleSettlements
  }
};

// 清算項目が1つの場合
export const SingleSettlement: Story = {
  args: {
    settlements: [
      {
        from: "二郎",
        to: "一郎",
        amount: 1500
      }
    ]
  }
};

// 複数の清算項目がある場合
export const MultipleSettlements: Story = {
  args: {
    settlements: [
      {
        from: "二郎",
        to: "一郎",
        amount: 1000
      },
      {
        from: "三郎",
        to: "一郎",
        amount: 2000
      },
      {
        from: "四郎",
        to: "二郎",
        amount: 1500
      },
      {
        from: "五郎",
        to: "三郎",
        amount: 3000
      }
    ]
  }
};

// 大きな金額の場合
export const LargeAmounts: Story = {
  args: {
    settlements: [
      {
        from: "二郎",
        to: "一郎",
        amount: 100000
      },
      {
        from: "三郎",
        to: "一郎",
        amount: 250000
      }
    ]
  }
};

// 空の配列の場合
export const EmptySettlements: Story = {
  args: {
    settlements: []
  }
};