'use client';

// MempoolVisualizer Component for Shadow-Book
// Enhanced with dramatic success animations and particle effects

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Skull,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable';

import type { Transaction, ExecutionResult } from '../types';

interface MempoolVisualizerProps {
  mode: 'public' | 'shadow';
  isExecuting?: boolean;
  lastResult?: ExecutionResult | null;
  className?: string;
}

function generateTransaction(type: 'user' | 'bot' = 'user'): Transaction {
  const tokens = ['ETH', 'USDC', 'WBTC'];
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    status: 'pending',
    amount: (Math.random() * 10).toFixed(4),
    token: tokens[Math.floor(Math.random() * tokens.length)]
  };
}

export function MempoolVisualizer({
  mode,
  isExecuting = false,
  lastResult,
  className
}: MempoolVisualizerProps) {
  const [publicTxs, setPublicTxs] = useState<Transaction[]>([]);
  const [shadowOrders, setShadowOrders] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate public mempool activity
  useEffect(() => {
    if (mode === 'public') {
      intervalRef.current = setInterval(() => {
        if (publicTxs.length < 8) {
          const newTx = generateTransaction('user');
          setPublicTxs((prev) => [...prev, newTx]);
        }
        if (Math.random() > 0.7 && publicTxs.length > 0) {
          const targetIdx = Math.floor(Math.random() * publicTxs.length);
          setPublicTxs((prev) =>
            prev.map((tx, idx) =>
              idx === targetIdx && tx.status === 'pending'
                ? { ...tx, status: 'attacked' }
                : tx
            )
          );
        }
        setPublicTxs((prev) => (prev.length > 6 ? prev.slice(1) : prev));
      }, 1500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, publicTxs.length]);

  // Handle order submission animation with longer success state
  useEffect(() => {
    if (isExecuting && mode === 'shadow') {
      const orderId = `order-${Date.now()}`;
      setShadowOrders((prev) => [...prev, orderId]);

      setTimeout(() => {
        setIsMatching(true);
        setTimeout(() => {
          setIsMatching(false);
          setShowSuccess(true);
          setShadowOrders([]);
          // Keep success visible for 4 seconds
          setTimeout(() => setShowSuccess(false), 4000);
        }, 1500);
      }, 800);
    }
  }, [isExecuting, mode]);

  return (
    <div className={`h-full min-h-[400px] ${className}`}>
      <ResizablePanelGroup direction='horizontal' className='h-full rounded-lg'>
        <ResizablePanel defaultSize={50} minSize={30}>
          <PublicMempoolPanel transactions={publicTxs} isActive={mode === 'public'} />
        </ResizablePanel>
        <ResizableHandle className='w-2 bg-zinc-800 transition-colors hover:bg-zinc-700' />
        <ResizablePanel defaultSize={50} minSize={30}>
          <ShadowBookPanel
            orders={shadowOrders}
            isActive={mode === 'shadow'}
            isMatching={isMatching}
            showSuccess={showSuccess}
            lastResult={lastResult}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function PublicMempoolPanel({ transactions, isActive }: { transactions: Transaction[]; isActive: boolean }) {
  return (
    <div className={`h-full rounded-l-lg p-4 transition-all duration-500 ${isActive ? 'border-red-500/30 bg-red-950/30' : 'border-zinc-800 bg-zinc-900/50'} border border-r-0`}>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Eye className={`h-4 w-4 ${isActive ? 'text-red-400' : 'text-zinc-500'}`} />
          <span className='font-mono text-xs text-zinc-400'>PUBLIC MEMPOOL</span>
        </div>
        <div className={`rounded px-2 py-0.5 font-mono text-[10px] ${isActive ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>
          {isActive ? 'EXPOSED' : 'INACTIVE'}
        </div>
      </div>

      {isActive && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='mb-4 rounded border border-red-500/20 bg-red-500/10 p-2'>
          <div className='flex items-center gap-2 font-mono text-[10px] text-red-400'>
            <Skull className='h-3 w-3' />
            MEV BOTS ACTIVE • YOUR ORDERS ARE VISIBLE
          </div>
        </motion.div>
      )}

      <div className='relative h-[calc(100%-80px)] overflow-hidden'>
        <AnimatePresence>
          {transactions.map((tx, index) => (
            <FloatingTransaction key={tx.id} transaction={tx} index={index} />
          ))}
        </AnimatePresence>
        {isActive && (
          <motion.div className='absolute right-2 bottom-2 flex items-center gap-1 text-red-400' animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            <Skull className='h-4 w-4' />
            <span className='font-mono text-[10px]'>SCANNING...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FloatingTransaction({ transaction, index }: { transaction: Transaction; index: number }) {
  const isAttacked = transaction.status === 'attacked';
  return (
    <motion.div
      initial={{ opacity: 0, x: -50, y: Math.random() * 200 }}
      animate={{ opacity: isAttacked ? [1, 0.5, 1] : 1, x: [0, 10, 0], y: 50 + index * 45, scale: isAttacked ? [1, 1.1, 0.9] : 1 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.5, x: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      className={`absolute right-4 left-4 rounded border p-2 font-mono text-xs ${isAttacked ? 'border-red-500/50 bg-red-500/20 text-red-300' : 'border-zinc-700 bg-zinc-800/50 text-zinc-300'}`}
    >
      <div className='flex items-center justify-between'>
        <span className='truncate'>{transaction.amount} {transaction.token}</span>
        {isAttacked && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className='flex items-center gap-1 text-red-400'>
            <Skull className='h-3 w-3' />
            <span className='text-[10px]'>SANDWICHED!</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function ShadowBookPanel({ orders, isActive, isMatching, showSuccess, lastResult }: { orders: string[]; isActive: boolean; isMatching: boolean; showSuccess: boolean; lastResult?: ExecutionResult | null }) {
  return (
    <div className={`h-full rounded-r-lg p-4 transition-all duration-500 ${isActive ? 'border-green-500/30 bg-green-950/30' : 'border-zinc-800 bg-zinc-900/50'} border border-l-0`}>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <EyeOff className={`h-4 w-4 ${isActive ? 'text-green-400' : 'text-zinc-500'}`} />
          <span className='font-mono text-xs text-zinc-400'>SHADOW-BOOK</span>
        </div>
        <div className={`rounded px-2 py-0.5 font-mono text-[10px] ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
          {isActive ? 'PROTECTED' : 'INACTIVE'}
        </div>
      </div>

      {isActive && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='mb-4 rounded border border-green-500/20 bg-green-500/10 p-2'>
          <div className='flex items-center gap-2 font-mono text-[10px] text-green-400'>
            <ShieldCheck className='h-3 w-3' />
            ORDERS ENCRYPTED • ZERO MEV EXPOSURE
          </div>
        </motion.div>
      )}

      <div className='relative flex h-[calc(100%-80px)] items-center justify-center'>
        <EncryptedBox isActive={isActive} isMatching={isMatching} showSuccess={showSuccess} orders={orders} />

        {lastResult && lastResult.matchedOrderId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='absolute right-2 bottom-2 left-2 rounded border border-green-500/20 bg-green-500/10 p-2'>
            <div className='grid grid-cols-3 gap-2 text-center'>
              <div>
                <div className='font-mono text-[10px] text-zinc-500'>SCANNED</div>
                <div className='font-mono text-xs text-green-400'>{lastResult.ordersScanned}</div>
              </div>
              <div>
                <div className='font-mono text-[10px] text-zinc-500'>TIME</div>
                <div className='font-mono text-xs text-green-400'>{lastResult.executionTimeMs.toFixed(1)}ms</div>
              </div>
              <div>
                <div className='font-mono text-[10px] text-zinc-500'>GAS</div>
                <div className='font-mono text-xs text-green-400'>{lastResult.gasUsed}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


function EncryptedBox({ isActive, isMatching, showSuccess, orders }: { isActive: boolean; isMatching: boolean; showSuccess: boolean; orders: string[] }) {
  return (
    <motion.div
      className={`relative flex h-48 w-48 items-center justify-center rounded-xl border-2 ${isActive ? 'border-green-500/50 bg-green-500/5' : 'border-zinc-700 bg-zinc-900/50'}`}
      animate={{
        boxShadow: showSuccess
          ? ['0 0 60px rgba(34, 197, 94, 0.4)', '0 0 80px rgba(34, 197, 94, 0.6)', '0 0 60px rgba(34, 197, 94, 0.4)']
          : isActive
            ? ['0 0 20px rgba(34, 197, 94, 0.1)', '0 0 40px rgba(34, 197, 94, 0.2)', '0 0 20px rgba(34, 197, 94, 0.1)']
            : 'none',
        borderColor: showSuccess ? '#22c55e' : isActive ? 'rgba(34, 197, 94, 0.5)' : '#3f3f46'
      }}
      transition={{ duration: showSuccess ? 0.5 : 2, repeat: showSuccess ? 3 : Infinity }}
    >
      {/* Particle effects during matching */}
      <AnimatePresence>
        {isMatching && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className='absolute h-2 w-2 rounded-full bg-green-400'
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [1, 0],
                  scale: [0, 1],
                  x: Math.cos((i * 30 * Math.PI) / 180) * 100,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 100
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Success state - checkmark with glow */}
      <AnimatePresence>
        {showSuccess ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className='flex flex-col items-center gap-2'
          >
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <CheckCircle2 className='h-16 w-16 text-green-400' />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='font-mono text-xs text-green-400'
            >
              MATCHED!
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className='flex flex-col items-center justify-center gap-1 font-mono text-[10px] text-green-300 text-center'
            >
              <Sparkles className='h-4 w-4' />
              <span>Zero MEV • Instant Settlement</span>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            animate={{ scale: isMatching ? [1, 1.3, 1] : 1, rotate: isMatching ? [0, 15, -15, 0] : 0 }}
            transition={{ duration: 0.6 }}
          >
            <Lock className={`h-12 w-12 ${isActive ? 'text-green-400' : 'text-zinc-600'}`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming Orders Animation */}
      <AnimatePresence>
        {orders.map((orderId, index) => (
          <motion.div
            key={orderId}
            initial={{ opacity: 1, x: -120, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className='absolute h-10 w-10 rounded-lg border-2 border-green-500 bg-green-500/40'
          />
        ))}
      </AnimatePresence>

      {/* Ripple effect on match */}
      {isMatching && (
        <>
          <motion.div
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1 }}
            className='absolute inset-0 rounded-xl border-2 border-green-400'
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className='absolute inset-0 rounded-xl border-2 border-green-400'
          />
        </>
      )}

      {/* Stylus Badge */}
      <div className='absolute -bottom-3 rounded border border-green-500/30 bg-zinc-900 px-2 py-0.5'>
        <div className='flex items-center gap-1 font-mono text-[10px] text-green-400'>
          <Zap className='h-3 w-3' />
          STYLUS
        </div>
      </div>

      {/* Activity Indicator */}
      {isActive && !showSuccess && (
        <motion.div className='absolute top-2 right-2' animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Activity className='h-4 w-4 text-green-400' />
        </motion.div>
      )}
    </motion.div>
  );
}

export default MempoolVisualizer;
