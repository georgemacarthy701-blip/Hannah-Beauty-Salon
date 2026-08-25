'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { sendDirectMessage, markConversationAsRead } from '@/app/actions/messages'
import { formatImageUrl } from '@/utils/image'
import { Search, Send, Mail, Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface MessagesClientProps {
  initialConversations: any[]
  currentUser: any
}

export default function MessagesClient({ initialConversations, currentUser }: MessagesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [conversations, setConversations] = useState<any[]>(initialConversations)
  const [activeConvId, setActiveConvId] = useState<string | null>(searchParams.get('conversationId'))
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sync initialConversations
  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  // Get conversationId from URL if updated
  useEffect(() => {
    const urlConvId = searchParams.get('conversationId')
    if (urlConvId) {
      setActiveConvId(urlConvId)
    }
  }, [searchParams])

  // Fetch active conversation messages
  const fetchMessages = async (convId: string) => {
    setLoadingMessages(true)
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
        // Mark as read
        await markConversationAsRead(convId)
        fetchConversationsList()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Fetch updated conversations list
  const fetchConversationsList = async () => {
    try {
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          profile_one:profiles!conversations_participant_one_fkey(id, full_name, role, avatar_cloudinary_url),
          profile_two:profiles!conversations_participant_two_fkey(id, full_name, role, avatar_cloudinary_url),
          direct_messages(id, message, is_read, sender_id, created_at)
        `)
        .order('last_message_at', { ascending: false })

      if (data) {
        setConversations(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Load messages on active thread change
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId)
    } else {
      setMessages([])
    }
  }, [activeConvId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime messages subscription matching active conversation
  useEffect(() => {
    if (!activeConvId) return

    const channel = supabase
      .channel(`chat-conversation-${activeConvId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'insert',
          schema: 'public',
          tableName: 'direct_messages',
          filter: `conversation_id=eq.${activeConvId}`
        },
        (payload: any) => {
          const newMsg = payload.new
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          // Mark read if incoming
          if (newMsg.receiver_id === currentUser.id) {
            markConversationAsRead(activeConvId)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConvId, supabase, currentUser.id])

  // Global messages insertion listener to update thread snippets and unread badges
  useEffect(() => {
    const globalChannel = supabase
      .channel('global-message-receipts')
      .on(
        'postgres_changes' as any,
        { event: 'insert', schema: 'public', tableName: 'direct_messages' },
        (payload: any) => {
          if (payload.new.receiver_id === currentUser.id) {
            fetchConversationsList()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(globalChannel)
    }
  }, [supabase, currentUser.id])

  const activeConv = conversations.find((c) => c.id === activeConvId)
  
  const getOtherParticipant = (conv: any) => {
    return conv.participant_one === currentUser.id ? conv.profile_two : conv.profile_one
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeConvId || !newMessage.trim() || isSubmitting) return

    const otherUser = getOtherParticipant(activeConv)
    if (!otherUser) return

    setIsSubmitting(true)
    const msgToSend = newMessage
    setNewMessage('')

    try {
      const res = await sendDirectMessage(activeConvId, otherUser.id, msgToSend)
      if (!res.error && res.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.message.id)) return prev
          return [...prev, res.message]
        })
        fetchConversationsList()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // Filter conversations based on recipient's name
  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv)
    return other?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 w-full h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden dark:border-zinc-800/80 dark:bg-zinc-900/40">
        
        {/* Left column - Conversations List */}
        <div className={`md:border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {/* List Search Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
            <h1 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Mail className="h-5 w-5 text-emerald-500" />
              Direct Messages
            </h1>
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-zinc-250 bg-zinc-50/50 dark:bg-zinc-800/40 py-2.5 pl-9 pr-4 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Threads List stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs">
                No active conversations found.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv)
                if (!other) return null

                const otherAvatar = other.avatar_cloudinary_url || other.avatar_url || null
                const directMsgs = conv.direct_messages || []
                
                // Get latest message snippet
                const lastMsg = directMsgs[directMsgs.length - 1]
                const snippet = lastMsg ? lastMsg.message : 'No messages yet'
                
                // Calculate unread badge count
                const unreadBadgeCount = directMsgs.filter(
                  (m: any) => m.sender_id !== currentUser.id && !m.is_read
                ).length

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id)
                      router.push(`/messages?conversationId=${conv.id}`, { scroll: false })
                    }}
                    className={`w-full text-left p-4 flex gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all ${
                      activeConvId === conv.id ? 'bg-zinc-50 dark:bg-zinc-850' : ''
                    }`}
                  >
                    <div className="shrink-0 relative">
                      {otherAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={formatImageUrl(otherAvatar, { width: 80, height: 80, crop: 'fill' })}
                          alt={other.full_name}
                          className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400 text-sm">
                          {other.full_name?.[0] || 'U'}
                        </div>
                      )}
                      {unreadBadgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-white">
                          {unreadBadgeCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                          {other.full_name}
                        </h4>
                        {lastMsg && (
                          <span className="text-[9px] text-zinc-400 shrink-0">
                            {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize truncate mt-0.5">
                        {other.role || 'Member'}
                      </p>
                      <p className={`text-xs mt-1 truncate ${unreadBadgeCount > 0 ? 'font-bold text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {snippet}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right column - Active Message Window */}
        <div className={`md:col-span-2 flex flex-col h-full bg-zinc-50/20 dark:bg-zinc-900/10 ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConvId && activeConv ? (
            <>
              {/* Header recipent profile row */}
              <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveConvId(null)
                      router.push('/messages', { scroll: false })
                    }}
                    className="md:hidden rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {/* Recipient info */}
                  {getOtherParticipant(activeConv)?.avatar_cloudinary_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formatImageUrl(getOtherParticipant(activeConv).avatar_cloudinary_url, { width: 80, height: 80, crop: 'fill' })}
                      alt={getOtherParticipant(activeConv).full_name}
                      className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400 text-sm">
                      {getOtherParticipant(activeConv)?.full_name?.[0] || 'U'}
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                      {getOtherParticipant(activeConv)?.full_name}
                    </h3>
                    <span className="text-[10px] text-zinc-400 capitalize">
                      {getOtherParticipant(activeConv)?.role || 'Member'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/professionals/${getOtherParticipant(activeConv)?.id}`}
                  className="rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 p-2 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </div>

              {/* Message Stream area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                    <span className="text-xs text-zinc-500">Loading chat thread...</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutgoing = msg.sender_id === currentUser.id
                    const msgTime = new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[75%] ${isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                            isOutgoing
                              ? 'bg-emerald-500 text-white rounded-br-none'
                              : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-250 border border-zinc-150 dark:border-zinc-800 rounded-bl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[9px] text-zinc-400 mt-1 px-1">
                          {msgTime}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Outgoing Message input form */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2.5 items-end">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none dark:text-white placeholder-zinc-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSubmitting}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white p-3 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Mail className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Select a conversation</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                Choose an active chat thread from the inbox, or visit a professional's profile page to send a direct message.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
