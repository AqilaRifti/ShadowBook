'use client';

// TradeInterface Component for Shadow-Book
// Requirements: 4.1, 4.2, 4.3, 4.5
//
// Provides the main trading terminal with:
// - Token input fields (ETH -> USDC)
// - Mode toggle (Public/Shadow-Book)
// - AI Sentinel risk badge
// - Cyberpunk terminal styling

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  Zap,
  ArrowDownUp,
  Loader2,
  Skull,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import type {
  OrderInput,
  ExecutionResult,
  RiskAssessment,
  TokenSymbol
} from '../types';
import { TOKENS } from '../types';
import { simulateTrade } from '../lib/market-maker';

interface TradeInterfaceProps {
  onOrderSubmit?: (order: OrderInput) => Promise<ExecutionResult>;
  onModeChange?: (mode: 'public' | 'shadow') => void;
  className?: string;
}

// AI Risk Assessment based on mode and amount
function assessRisk(mode: 'public' | 'shadow', amount: string): RiskAssessment {
  const amountNum = parseFloat(amount) || 0;

  if (mode === 'shadow') {
    return {
      mevProbability: 'low',
      recommendation: 'Protected by Shadow-Book',
      factors: ['Order hidden from mempool', 'No sandwich attack possible']
    };
  }

  // Public mode risk assessment
  if (amountNum > 10) {
    return {
      mevProbability: 'high',
      recommendation: 'Use Shadow-Book',
      factors: [
        'Large order visible to MEV bots',
        'High sandwich attack probability',
        'Estimated loss: 2-5%'
      ]
    };
  } else if (amountNum > 1) {
    return {
      mevProbability: 'medium',
      recommendation: 'Consider Shadow-Book',
      factors: ['Order visible in mempool', 'Moderate MEV risk']
    };
  }

  return {
    mevProbability: 'low',
    recommendation: 'Low risk trade',
    factors: ['Small order size', 'Lower MEV incentive']
  };
}

export function TradeInterface({
  onOrderSubmit,
  onModeChange,
  className
}: TradeInterfaceProps) {
  const [tokenIn, setTokenIn] = useState<TokenSymbol>('ETH');
  const [tokenOut, setTokenOut] = useState<TokenSymbol>('USDC');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'public' | 'shadow'>('shadow');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const riskAssessment = assessRisk(mode, amount);

  const handleModeChange = useCallback(
    (checked: boolean) => {
      const newMode = checked ? 'shadow' : 'public';
      setMode(newMode);
      onModeChange?.(newMode);
    },
    [onModeChange]
  );

  const handleSwapTokens = useCallback(() => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  }, [tokenIn, tokenOut]);

  const handleSubmit = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    const order: OrderInput = {
      tokenIn: TOKENS[tokenIn].address,
      tokenOut: TOKENS[tokenOut].address,
      amount,
      isBuy: tokenIn === 'USDC' // Buying if paying with stablecoin
    };

    try {
      const result = onOrderSubmit
        ? await onOrderSubmit(order)
        : await simulateTrade(order, mode);

      if (result.success) {
        if (mode === 'public' && result.mevLossPercent) {
          // Show MEV attack toast for public swaps
          const lossAmount = (parseFloat(amount) * result.mevLossPercent / 100).toFixed(4);
          const lossUsd = (parseFloat(lossAmount) * 3000).toFixed(2);
          toast.error(
            <div className='space-y-2'>
              <div className='flex items-center gap-2 font-mono text-sm text-red-400'>
                <Skull className='h-4 w-4' />
                SANDWICHED BY MEV BOT!
              </div>
              <div className='font-mono text-xs text-red-300'>
                You lost {result.mevLossPercent.toFixed(1)}% to sandwich attack
              </div>
              <div className='flex items-center gap-1 font-mono text-xs text-red-400'>
                <TrendingDown className='h-3 w-3' />
                -{lossAmount} {tokenIn} (~${lossUsd})
              </div>
              <div className='mt-2 rounded border border-green-500/30 bg-green-500/10 p-2 font-mono text-[10px] text-green-400'>
                💡 Use Shadow-Book to avoid MEV attacks
              </div>
            </div>,
            { duration: 5000 }
          );
        } else if (result.matchedOrderId) {
          toast.success(
            <div className='space-y-1'>
              <div className='font-mono text-sm'>✓ Order Matched Instantly</div>
              <div className='text-muted-foreground font-mono text-xs'>
                Stylus Compute: Scanned {result.ordersScanned} orders in{' '}
                {result.executionTimeMs.toFixed(1)}ms
              </div>
              <div className='font-mono text-xs text-green-400'>
                Gas: {result.gasUsed} (vs ~$500 in Solidity)
              </div>
              <div className='font-mono text-xs text-green-300'>
                MEV Loss: $0.00 ✓
              </div>
            </div>
          );
        } else {
          toast.info('Order added to Shadow-Book. Waiting for match...');
        }
      }
    } catch (error) {
      toast.error('Transaction failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, tokenIn, tokenOut, mode, onOrderSubmit]);

  return (
    <Card
      className={`border-zinc-800 bg-black/90 shadow-[0_0_50px_rgba(0,255,136,0.1)] ${className} `}
    >
      <CardHeader className='border-b border-zinc-800 pb-4'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 font-mono text-xl text-zinc-100'>
              <Zap className='h-5 w-5 text-green-400' />
              SHADOW-BOOK
            </CardTitle>
            <CardDescription className='mt-1 font-mono text-xs text-zinc-500'>
              Dark Pool Order Execution • Arbitrum Stylus
            </CardDescription>
          </div>
          <ModeToggle mode={mode} onModeChange={handleModeChange} />
        </div>
      </CardHeader>

      <CardContent className='space-y-6 pt-6'>
        {/* AI Sentinel Badge */}
        <RiskBadge assessment={riskAssessment} />

        {/* Token Input Section */}
        <div className='space-y-3'>
          <TokenInput
            label='You Pay'
            token={tokenIn}
            onTokenChange={(t) => setTokenIn(t as TokenSymbol)}
            amount={amount}
            onAmountChange={setAmount}
            excludeToken={tokenOut}
          />

          <div className='flex justify-center'>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleSwapTokens}
              className='rounded-full border border-zinc-700 bg-zinc-900 hover:border-green-500/50 hover:bg-zinc-800'
            >
              <ArrowDownUp className='h-4 w-4 text-zinc-400' />
            </Button>
          </div>

          <TokenInput
            label='You Receive'
            token={tokenOut}
            onTokenChange={(t) => setTokenOut(t as TokenSymbol)}
            excludeToken={tokenIn}
            readOnly
            estimatedAmount={calculateEstimate(amount, tokenIn, tokenOut)}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !amount}
          className={`h-12 w-full font-mono text-sm ${mode === 'shadow'
            ? 'bg-green-600 text-black hover:bg-green-500'
            : 'bg-red-600 text-white hover:bg-red-500'
            } transition-all duration-300 disabled:opacity-50`}
        >
          {isSubmitting ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : mode === 'shadow' ? (
            <ShieldCheck className='mr-2 h-4 w-4' />
          ) : (
            <AlertTriangle className='mr-2 h-4 w-4' />
          )}
          {isSubmitting
            ? 'EXECUTING...'
            : mode === 'shadow'
              ? 'EXECUTE PROTECTED SWAP'
              : 'EXECUTE PUBLIC SWAP (RISKY)'}
        </Button>

        {/* Stats Footer */}
        <div className='grid grid-cols-3 gap-2 border-t border-zinc-800 pt-2'>
          <Stat label='Network' value='Stylus' />
          <Stat
            label='MEV Protection'
            value={mode === 'shadow' ? 'ON' : 'OFF'}
          />
          <Stat label='Est. Gas' value='<$0.01' />
        </div>
      </CardContent>
    </Card>
  );
}

// Sub-components

function ModeToggle({
  mode,
  onModeChange
}: {
  mode: 'public' | 'shadow';
  onModeChange: (checked: boolean) => void;
}) {
  return (
    <div className='flex items-center gap-3'>
      <span
        className={`font-mono text-xs ${mode === 'public' ? 'text-red-400' : 'text-zinc-500'}`}
      >
        PUBLIC
      </span>
      <Switch
        checked={mode === 'shadow'}
        onCheckedChange={onModeChange}
        className='data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600'
      />
      <span
        className={`font-mono text-xs ${mode === 'shadow' ? 'text-green-400' : 'text-zinc-500'}`}
      >
        SHADOW
      </span>
    </div>
  );
}

function RiskBadge({ assessment }: { assessment: RiskAssessment }) {
  const colors = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={assessment.mevProbability}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`rounded-lg border p-3 font-mono text-xs ${colors[assessment.mevProbability]} `}
      >
        <div className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            {assessment.mevProbability === 'low' ? (
              <ShieldCheck className='h-4 w-4' />
            ) : (
              <AlertTriangle className='h-4 w-4' />
            )}
            AI SENTINEL: {assessment.mevProbability.toUpperCase()} MEV RISK
          </span>
          <Badge
            variant='outline'
            className={`text-[10px] ${colors[assessment.mevProbability]}`}
          >
            {assessment.recommendation}
          </Badge>
        </div>
        <div className='mt-2 text-[10px] opacity-70'>
          {assessment.factors.join(' • ')}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TokenInput({
  label,
  token,
  onTokenChange,
  amount,
  onAmountChange,
  excludeToken,
  readOnly,
  estimatedAmount
}: {
  label: string;
  token: TokenSymbol;
  onTokenChange: (token: string) => void;
  amount?: string;
  onAmountChange?: (amount: string) => void;
  excludeToken: TokenSymbol;
  readOnly?: boolean;
  estimatedAmount?: string;
}) {
  const availableTokens = Object.keys(TOKENS).filter(
    (t) => t !== excludeToken
  ) as TokenSymbol[];

  return (
    <div className='rounded-lg border border-zinc-800 bg-zinc-900/50 p-4'>
      <Label className='mb-2 block font-mono text-xs text-zinc-500'>
        {label}
      </Label>
      <div className='flex items-center gap-3'>
        <Select value={token} onValueChange={onTokenChange}>
          <SelectTrigger className='w-28 border-zinc-700 bg-zinc-800 font-mono'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='border-zinc-700 bg-zinc-900'>
            {availableTokens.map((t) => (
              <SelectItem key={t} value={t} className='font-mono'>
                {TOKENS[t].symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {readOnly ? (
          <div className='flex-1 text-right'>
            <span className='font-mono text-2xl text-zinc-300'>
              {estimatedAmount || '0.00'}
            </span>
          </div>
        ) : (
          <Input
            type='number'
            placeholder='0.00'
            value={amount}
            onChange={(e) => onAmountChange?.(e.target.value)}
            className='flex-1 border-0 bg-transparent text-right font-mono text-2xl text-zinc-100 focus-visible:ring-0'
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='text-center'>
      <div className='font-mono text-[10px] text-zinc-500 uppercase'>
        {label}
      </div>
      <div className='font-mono text-xs text-zinc-300'>{value}</div>
    </div>
  );
}

// Helper function to calculate estimated output
function calculateEstimate(
  amount: string,
  tokenIn: TokenSymbol,
  tokenOut: TokenSymbol
): string {
  const amountNum = parseFloat(amount) || 0;
  if (amountNum === 0) return '0.00';

  // Simplified price estimation
  const prices: Record<TokenSymbol, number> = {
    ETH: 3000,
    USDC: 1,
    WBTC: 60000
  };

  const inValue = amountNum * prices[tokenIn];
  const outAmount = inValue / prices[tokenOut];

  return outAmount.toFixed(tokenOut === 'USDC' ? 2 : 6);
}

export default TradeInterface;
