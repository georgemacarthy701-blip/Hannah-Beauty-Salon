'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { withdrawApplication } from '@/app/actions/applications'
import { Trash2, Loader2 } from 'lucide-react'

interface WithdrawButtonProps {
  applicationId: string
}

export default function WithdrawButton({ applicationId }: WithdrawButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this application?')) return

    setLoading(true)
    const res = await withdrawApplication(applicationId)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || 'Failed to withdraw application')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleWithdraw}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 text-xs font-semibold text-rose-600 transition-colors disabled:opacity-50 dark:border-rose-950/30 dark:bg-rose-950/20 dark:text-rose-400"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      Withdraw Application
    </button>
  )
}
