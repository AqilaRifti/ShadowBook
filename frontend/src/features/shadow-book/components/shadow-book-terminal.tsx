'use client';

// Shadow-Book Terminal - Main Trading Page Component
// Requirements: 7.1, 7.3, 7.4, 7.5, 2.3, 3.4

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Activity, TrendingUp, Wallet } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { TradeInterface } from './trade-interface';
import { MempoolVisualizer } from './mempool-visualizer';
import type { OrderInput, ExecutionResult } from '../types';
import { simulateTrade } from '../lib/market-maker';

interface ShadowBookTerminalProps {
  className?: string;
}

export function ShadowBookTerminal({ className }: ShadowBookTerminalProps) {
  const [mode, setMode] = useState<'public' | 'shadow'>('shadow');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalSaved: 0,
    avgExecutionTime: 0
  });

  // Wallet connection
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleModeChange = useCallback((newMode: 'public' | 'shadow') => {
    setMode(newMode);
  }, []);

  const handleOrderSubmit = useCallback(
    async (order: OrderInput): Promise<ExecutionResult> => {
      setIsExecuting(true);
      try {
        const result = await simulateTrade(order, mode);
        setLastResult(result);
        if (result.success && result.matchedOrderId) {
          // Track MEV saved (only in shadow mode)
          const mevSaved = mode === 'shadow' ? Math.floor(parseFloat(order.amount) * 3000 * 0.03) : 0;
          setStats((prev) => ({
            totalTrades: prev.totalTrades + 1,
            totalSaved: prev.totalSaved + mevSaved,
            avgExecutionTime:
              (prev.avgExecutionTime * prev.totalTrades + result.executionTimeMs) /
              (prev.totalTrades + 1)
          }));
        }
        return result;
      } finally {
        setTimeout(() => setIsExecuting(false), 1500);
      }
    },
    [mode]
  );

  return (
    <div className={`min-h-screen bg-black p-4 md:p-8 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='mb-8'
      >
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg border border-green-500/30 bg-green-500/10 p-2'>
              <ShieldCheck className='h-8 w-8 text-green-400' />
            </div>
            <div>
              <h1 className='font-mono text-2xl font-bold text-zinc-100 md:text-3xl'>
                SHADOW-BOOK
              </h1>
              <p className='font-mono text-xs text-zinc-500'>
                Dark Pool DEX • Arbitrum Stylus • Zero MEV
              </p>
            </div>
          </div>

          {/* Live Stats + Wallet */}
          <div className='flex items-center gap-4'>
            <StatBadge
              icon={<Activity className='h-3 w-3' />}
              label='Trades'
              value={stats.totalTrades.toString()}
            />
            <StatBadge
              icon={<TrendingUp className='h-3 w-3' />}
              label='MEV Saved'
              value={`$${stats.totalSaved}`}
              highlight
            />
            <StatBadge
              icon={<Zap className='h-3 w-3' />}
              label='Avg Time'
              value={`${stats.avgExecutionTime.toFixed(1)}ms`}
            />
            {isConnected ? (
              <Button
                variant='outline'
                size='sm'
                onClick={() => disconnect()}
                className='border-green-500/30 bg-green-500/10 font-mono text-xs text-green-400 hover:bg-green-500/20'
              >
                <Wallet className='mr-2 h-3 w-3' />
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Button>
            ) : (
              <Button
                variant='outline'
                size='sm'
                onClick={() => connect({ connector: connectors[0] })}
                className='border-zinc-700 bg-zinc-900 font-mono text-xs text-zinc-300 hover:border-green-500/50 hover:bg-zinc-800'
              >
                <Wallet className='mr-2 h-3 w-3' />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TradeInterface
            onOrderSubmit={handleOrderSubmit}
            onModeChange={handleModeChange}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className='h-full border-zinc-800 bg-black/90'>
            <CardHeader className='border-b border-zinc-800 pb-4'>
              <CardTitle className='flex items-center gap-2 font-mono text-sm text-zinc-400'>
                <Activity className='h-4 w-4' />
                MEMPOOL COMPARISON
              </CardTitle>
            </CardHeader>
            <CardContent className='h-[450px] p-0'>
              <MempoolVisualizer
                mode={mode}
                isExecuting={isExecuting}
                lastResult={lastResult}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom: Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mt-6'
      >
        <Card className='border-zinc-800 bg-black/90'>
          <CardContent className='py-4'>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <MetricCard title='Stylus Advantage' value='500x' subtitle='Cheaper than Solidity' color='green' />
              <MetricCard title='Order Book Depth' value='150+' subtitle='Orders scanned per match' color='blue' />
              <MetricCard title='MEV Protection' value='100%' subtitle='Orders hidden from bots' color='purple' />
              <MetricCard title='Execution Speed' value='<50ms' subtitle='Average match time' color='yellow' />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className='mt-6 text-center'
      >
        <p className='font-mono text-xs text-zinc-600'>
          Built with Arbitrum Stylus • Rust Smart Contracts • Zero Knowledge Order Matching
        </p>
      </motion.div>
    </div>
  );
}

function StatBadge({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono ${highlight ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}>
      {icon}
      <div className='text-xs'>
        <span className='text-zinc-500'>{label}: </span>
        <span className={highlight ? 'text-green-400' : 'text-zinc-300'}>{value}</span>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: 'green' | 'blue' | 'purple' | 'yellow' }) {
  const colors = {
    green: 'text-green-400 border-green-500/30',
    blue: 'text-blue-400 border-blue-500/30',
    purple: 'text-purple-400 border-purple-500/30',
    yellow: 'text-yellow-400 border-yellow-500/30'
  };
  return (
    <div className='rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center'>
      <div className='mb-1 font-mono text-[10px] text-zinc-500 uppercase'>{title}</div>
      <div className={`font-mono text-2xl font-bold ${colors[color]}`}>{value}</div>
      <div className='mt-1 font-mono text-[10px] text-zinc-600'>{subtitle}</div>
    </div>
  );
}

export default ShadowBookTerminal;
