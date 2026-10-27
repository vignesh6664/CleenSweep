import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { useCopilot } from '@/context/CopilotContext';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  sendCopilotChat,
  confirmCopilotAction,
  dismissCopilotAction,
  fetchCopilotPendingActions,
  type PendingAction,
} from '@/services/api';
import { useMe } from '@/hooks/useMe';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  proposedActions?: PendingAction[];
  timestamp: Date;
}

interface CopilotDrawerProps {
  accountId?: string;
}

export function CopilotDrawer({ accountId }: CopilotDrawerProps) {
  const { isOpen, setIsOpen } = useCopilot();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hi! I'm **CleanSweep Copilot**. I can scan your AWS accounts for orphaned EBS volumes, idle EC2 instances, and propose safe cost-reduction cleanups.\n\n*Note: Cleanups are only staged as proposals—nothing is deleted or stopped until you confirm.*",
      timestamp: new Date(),
    },
  ]);

  const { data: user, upgrade } = useMe();
  const isPro = user?.subscriptionTier === 'PRO';
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      loadPendingActions();
    }
  }, [isOpen, messages]);

  const loadPendingActions = async () => {
    try {
      const actions = await fetchCopilotPendingActions();
      setPendingActions(actions);
    } catch {
      // Ignore initial load error
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendCopilotChat(text, accountId);

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        proposedActions: response.proposedActions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.proposedActions && response.proposedActions.length > 0) {
        setPendingActions((prev) => [...prev, ...response.proposedActions]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Error:** ${err.message || 'Failed to communicate with Copilot.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (action: PendingAction) => {
    if (!isPro) {
      toast.error('PRO Tier Required', {
        description: 'Upgrade to PRO to confirm and execute automated cleanups.',
        action: {
          label: 'Upgrade',
          onClick: () => upgrade(),
        },
      });
      return;
    }

    setActionLoadingId(action.id);
    try {
      const result = await confirmCopilotAction(action.id);
      toast.success('Action Executed', {
        description: result.message || `Remediation executed for ${action.resourceId}`,
      });

      // Invalidate queries so dashboard tables and audit logs update immediately
      queryClient.invalidateQueries({ queryKey: ['scanResults'] });
      queryClient.invalidateQueries({ queryKey: ['idle-instances'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });

      // Update local state
      setPendingActions((prev) => prev.filter((a) => a.id !== action.id));
      setMessages((prev) => [
        ...prev,
        {
          id: `exec_${Date.now()}`,
          sender: 'assistant',
          text: `✅ **Executed cleanup:** ${action.actionType} for \`${action.resourceId}\` in \`${action.region}\`.\nPotential savings: **+$${action.estimatedMonthlySavings}/month**. Recorded in audit trail (*actor: agent*).`,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      toast.error('Execution Failed', {
        description: err.message || 'Failed to execute proposed action.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismissAction = async (actionId: string) => {
    try {
      await dismissCopilotAction(actionId);
      setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
      toast.info('Proposal dismissed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to dismiss action');
    }
  };

  const quickPrompts = [
    '💰 What is my total monthly waste?',
    '📦 List all orphaned EBS volumes',
    '⚡ Are there any idle EC2 instances?',
    '🧹 Propose safe cleanups for unused volumes',
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.div
          className="fixed bottom-6 right-6 z-40"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            className="relative bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/25 h-12 px-5 rounded-full flex items-center gap-2.5 font-medium border border-indigo-400/30"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Ask Copilot</span>
            {pendingActions.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                {pendingActions.length}
              </span>
            )}
          </Button>
        </motion.div>
      )}

      {/* Slide-over Dock Panel (Side-by-side, no black background overlay) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 sm:top-[80px] bottom-0 right-0 h-full sm:h-[calc(100vh-80px)] w-full sm:w-[460px] bg-slate-950/95 border-l border-slate-800/80 shadow-2xl z-40 flex flex-col backdrop-blur-md"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100 text-base leading-none">
                      CleanSweep Copilot
                    </h3>
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px] px-1.5 py-0">
                      AI
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Safe FinOps Agent • Confirmation Guarded
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pending Proposals Shelf (if any) */}
            {pendingActions.length > 0 && (
              <div className="p-3 bg-amber-500/10 border-b border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Pending Cleanups Awaiting Confirmation ({pendingActions.length})</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pendingActions.map((action) => (
                    <div
                      key={action.id}
                      className="bg-slate-900/90 border border-slate-700/60 rounded-lg p-2.5 text-xs space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-200 font-medium">
                          {action.resourceId}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            action.actionType === 'DELETE_EBS'
                              ? 'border-rose-500/40 text-rose-400 bg-rose-500/10 text-[10px]'
                              : 'border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]'
                          }
                        >
                          {action.actionType === 'DELETE_EBS' ? 'Delete EBS' : 'Stop EC2'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-slate-400">
                        <span>Region: {action.region}</span>
                        <span className="text-emerald-400 font-semibold">
                          +${action.estimatedMonthlySavings}/mo
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissAction(action.id)}
                          className="h-6 px-2 text-slate-400 hover:text-slate-200 text-[11px]"
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmAction(action)}
                          disabled={actionLoadingId === action.id}
                          className="h-6 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] gap-1"
                        >
                          {actionLoadingId === action.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Confirm
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="text-sm leading-relaxed text-slate-200">
                      <Markdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                          li: ({ children }) => <li className="text-slate-200">{children}</li>,
                          code: ({ children }) => (
                            <code className="bg-slate-800/80 text-indigo-300 px-1.5 py-0.5 rounded text-[12px] font-mono border border-slate-700/50">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {m.text}
                      </Markdown>
                    </div>

                    {/* Inline Proposed Actions within Assistant Reply */}
                    {m.proposedActions && m.proposedActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                        <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Proposed Action (Requires Confirmation)</span>
                        </div>
                        {m.proposedActions.map((action) => (
                          <div
                            key={action.id}
                            className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-slate-300">{action.resourceId}</span>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                +${action.estimatedMonthlySavings}/mo
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-[11px]">{action.reason}</p>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                onClick={() => handleConfirmAction(action)}
                                disabled={actionLoadingId === action.id}
                                className="h-6 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] gap-1"
                              >
                                {actionLoadingId === action.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                Confirm {action.actionType === 'DELETE_EBS' ? 'Delete' : 'Stop'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Copilot is scanning AWS data & checking tags...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 2 && (
              <div className="p-3 border-t border-slate-900 bg-slate-950/40">
                <p className="text-[11px] text-slate-500 font-medium mb-1.5">Suggested prompts:</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 text-left transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Box */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/40">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about AWS waste, idle EC2, or cleanup..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 w-9 p-0 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 px-1">
                <span>Safe by design: Production resources blocked.</span>
                {!isPro && (
                  <span className="text-amber-400/80 cursor-pointer" onClick={() => upgrade()}>
                    FREE Tier (Upgrade for auto-execution)
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
