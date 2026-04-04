import React, { useState, useEffect } from 'react'
import { CheckCircle2, ClipboardList, Edit3, FileText, Sparkles, Trash2, XCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Input } from '@/components/common/Input'
import { LoadingSpinner, EmptyState } from '@/components/common'
import { adminService } from '@/services/adminService'
import { formatters } from '@/utils/formatters'

interface AuditLog {
  id: number
  action: string
  entity_type: string
  entity_id: number
  user_id: number
  old_value?: string
  new_value?: string
  created_at: string
}

export const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const result = await adminService.getAuditLog(1, 100)
        setLogs(result?.data || [])
      } catch (err) {
        console.error('Failed to load audit logs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  if (loading) return <LoadingSpinner fullHeight />

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_id.toString().includes(search)
  )

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600 bg-green-50'
    if (action.includes('update')) return 'text-blue-600 bg-blue-50'
    if (action.includes('delete')) return 'text-red-600 bg-red-50'
    if (action.includes('approve')) return 'text-green-600 bg-green-50'
    if (action.includes('reject')) return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <Sparkles className="h-5 w-5" />
    if (action.includes('update')) return <Edit3 className="h-5 w-5" />
    if (action.includes('delete')) return <Trash2 className="h-5 w-5" />
    if (action.includes('approve')) return <CheckCircle2 className="h-5 w-5" />
    if (action.includes('reject')) return <XCircle className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Audit Log</h1>
          <p className="text-gray-600 mb-8">Complete activity history of all administrative actions</p>

          <div className="mb-6">
            <Input
              label="Search logs"
              placeholder="Search by action, entity type, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map(log => (
                <div key={log.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`text-2xl px-2 py-1 rounded`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {log.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {log.entity_type} (ID: {log.entity_id})
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  </div>

                  {log.old_value && log.new_value && (
                    <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                      <p className="text-gray-700 mb-2">
                        <span className="font-semibold">Before:</span> <code className="bg-white px-2 py-1 rounded">{log.old_value}</code>
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">After:</span> <code className="bg-white px-2 py-1 rounded">{log.new_value}</code>
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Admin ID: {log.user_id}</p>
                    <p className="text-xs text-gray-500">{formatters.dateTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Logs Found"
              description="No audit logs match your search criteria."
              icon={<ClipboardList className="h-10 w-10" />}
            />
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold inline-flex items-center gap-1"><ClipboardList className="h-4 w-4" />Audit Log:</span> This log records all administrative actions including claim approvals, rejections, trigger simulations, and system changes. All actions are timestamped and attributed to the admin user.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
