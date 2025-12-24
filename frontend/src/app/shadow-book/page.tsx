import { ShadowBookTerminal } from '@/features/shadow-book/components/shadow-book-terminal';
import { Web3Provider } from '@/features/shadow-book/providers/web3-provider';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Shadow-Book | Dark Pool DEX on Arbitrum Stylus',
  description:
    'Zero MEV, Zero Slippage, Institutional-grade privacy. Trade on the first dark pool limit order book powered by Arbitrum Stylus.'
};

export default function ShadowBookPage() {
  return (
    <Web3Provider>
      <ShadowBookTerminal />
      <Toaster
        position='bottom-right'
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#fafafa'
          }
        }}
      />
    </Web3Provider>
  );
}
