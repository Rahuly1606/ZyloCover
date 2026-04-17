import React, { useState, useEffect } from 'react'
import {
    Users, ShieldAlert, BarChart3, Settings, LogOut, Search,
    CheckCircle2, XCircle, Zap, Sliders, Database
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/common/Button'
import { StatusBadge, LoadingSpinner, EmptyState } from '@/components/common'
import { adminService } from '@/services/adminService'
import { formatters } from '@/utils/formatters'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

type AdminTab = 'dashboard' | 'approvals' | 'users' | 'claims' | 'fraud-queue' | 'financial' | 'audit' | 'simulator'

interface TabConfig {
    id: AdminTab
    label: string
    icon: React.ReactNode
}

export const AdminCenter = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
    const [loading, setLoading] = useState(false)

    const tabs: TabConfig[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
        { id: 'approvals', label: 'Approvals', icon: <CheckCircle2 className="h-5 w-5" /> },
        { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" /> },
        { id: 'claims', label: 'Claims', icon: <LogOut className="h-5 w-5" /> },
        { id: 'fraud-queue', label: 'Fraud Queue', icon: <ShieldAlert className="h-5 w-5" /> },
        { id: 'financial', label: 'Config', icon: <Settings className="h-5 w-5" /> },
        { id: 'simulator', label: 'Simulator', icon: <Zap className="h-5 w-5" /> },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
                    <div className="px-6 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => logout()}
                                className="gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                        <p className="text-gray-600 mb-6">Complete admin management system for Zylocover</p>

                        {/* Tab Navigation */}
                        <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-purple-600 text-purple-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'dashboard' && <DashboardTab />}
                    {activeTab === 'approvals' && <ApprovalsTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'claims' && <ClaimsTab />}
                    {activeTab === 'fraud-queue' && <FraudQueueTab />}
                    {activeTab === 'financial' && <FinancialConfigTab />}
                    {activeTab === 'simulator' && <SimulatorTab />}
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardTab() {
    const [analytics, setAnalytics] = useState<any>(null)
    const [forecast, setForecast] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [analyticsResult, forecastResult] = await Promise.all([
                adminService.getAnalytics(),
                adminService.getForecast(),
            ])
            setAnalytics(analyticsResult)
            setForecast(forecastResult)
        } catch (err) {
            console.error('Failed to load analytics:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingSpinner />

    const fm = analytics?.financial_metrics
    const om = analytics?.operational_metrics

    return (
        <div className="space-y-6">
            {/* Financial Metrics */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricBox
                        label="Gross Written Premium"
                        value={formatters.currency(fm?.gross_written_premium_week || 0)}
                        color="blue"
                    />
                    <MetricBox
                        label="Total Claims Paid"
                        value={formatters.currency(fm?.total_claims_paid_week || 0)}
                        color="red"
                    />
                    <MetricBox
                        label="Loss Ratio"
                        value={`${((fm?.loss_ratio || 0) * 100).toFixed(1)}%`}
                        status={fm?.loss_status}
                        color={fm?.loss_status === 'healthy' ? 'green' : fm?.loss_status === 'warning' ? 'amber' : 'red'}
                    />
                    <MetricBox
                        label="Combined Ratio"
                        value={`${((fm?.combined_ratio || 0) * 100).toFixed(1)}%`}
                        color="purple"
                    />
                </div>
            </div>

            {/* Operational Metrics */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Operational Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricBox
                        label="Active Policies"
                        value={om?.active_policies || 0}
                        color="green"
                    />
                    <MetricBox
                        label="Claims Triggered Today"
                        value={om?.claims_triggered_today || 0}
                        color="blue"
                    />
                    <MetricBox
                        label="Claims Flagged"
                        value={om?.claims_flagged || 0}
                        color="red"
                    />
                    <MetricBox
                        label="Avg Processing Time"
                        value={`${Math.round(om?.average_trigger_to_payout_minutes || 0)} min`}
                        color="purple"
                    />
                </div>
            </div>

            {/* Loss Ratio by City */}
            {analytics?.loss_ratio_by_city && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Loss Ratio by City</h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.loss_ratio_by_city).map(([city, ratio]: [string, any]) => (
                            <div key={city} className="flex items-center justify-between">
                                <span className="text-gray-700 font-medium">{city}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${Math.min((ratio || 0) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-gray-900 font-semibold text-right w-16">
                                        {((ratio || 0) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Risk Forecast */}
            {forecast?.cities && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Risk Forecast</h3>
                    <div className="space-y-4">
                        {Object.entries(forecast.cities).slice(0, 3).map(([city, data]: [string, any]) => (
                            <div key={city} className="border border-gray-200 rounded-lg p-4">
                                <p className="font-semibold text-gray-900 mb-2">{city}</p>
                                <div className="grid grid-cols-7 gap-2">
                                    {data.daily_forecasts?.map((day: any, idx: number) => (
                                        <div key={idx} className="text-center">
                                            <div className={`text-xs font-semibold px-2 py-1 rounded ${day.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                day.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                    day.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>{day.risk_level}</div>
                                            <p className="text-xs text-gray-600 mt-1">{(day.probability * 100).toFixed(0)}%</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPROVALS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function ApprovalsTab() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [showModal, setShowModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchPendingApprovals()
    }, [page])

    const fetchPendingApprovals = async () => {
        try {
            setLoading(true)
            const result = await adminService.getPendingApprovals(page, 20)
            setUsers(result?.data || [])
            setTotal(result?.total || 0)
        } catch (err) {
            console.error('Failed to load pending approvals:', err)
            setUsers([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    const handleViewProfile = async (userId: number) => {
        try {
            const profile = await adminService.getUserFullProfile(userId)
            setSelectedUser(profile)
            setShowModal(true)
        } catch (err) {
            alert('Failed to load user profile')
        }
    }

    const handleApprove = async (userId: number) => {
        if (!confirm('Approve this user?')) return
        setActionLoading(true)
        try {
            await adminService.approveUserVerification(userId, 'approve')
            fetchPendingApprovals()
            setShowModal(false)
            alert('User approved successfully')
        } catch (err) {
            alert('Failed to approve user')
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async (userId: number) => {
        const reason = prompt('Reason for rejection:')
        if (!reason) return
        setActionLoading(true)
        try {
            await adminService.approveUserVerification(userId, 'reject', reason)
            fetchPendingApprovals()
            setShowModal(false)
            alert('User rejected')
        } catch (err) {
            alert('Failed to reject user')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                    <strong>User Approval Queue:</strong> Review new user registrations, verify job proof images, and approve/reject accounts.
                </p>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : users.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Platform</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">City</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Income</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Registered</th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{user.name}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600 uppercase">{user.platform}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{user.city}</td>
                                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                                            {formatters.currency(user.avg_daily_income)}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">
                                            {formatters.formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-3 text-center text-sm">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleViewProfile(user.id)}
                                            >
                                                Review
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} pending
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page * 20 >= total}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <EmptyState title="No pending approvals" description="All users have been reviewed" />
            )}

            {/* User Profile Modal */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-2xl font-bold text-gray-900">User Profile Review</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-gray-900">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Job Proof Image */}
                            {selectedUser.job_proof_image && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Job Proof Image</h3>
                                    <img
                                        src={selectedUser.job_proof_image}
                                        alt="Job Proof"
                                        className="w-full max-w-2xl rounded-lg border border-gray-300"
                                    />
                                </div>
                            )}

                            {/* Basic Info */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoField label="Name" value={selectedUser.name} />
                                    <InfoField label="Email" value={selectedUser.email} />
                                    <InfoField label="Phone" value={selectedUser.phone} />
                                    <InfoField label="Employee ID" value={selectedUser.employee_id} />
                                </div>
                            </div>

                            {/* Work Info */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Work Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoField label="Platform" value={selectedUser.platform?.toUpperCase()} />
                                    <InfoField label="City" value={selectedUser.city} />
                                    <InfoField label="Work Zone" value={selectedUser.work_zone} />
                                    <InfoField label="Daily Income" value={formatters.currency(selectedUser.avg_daily_income)} />
                                    <InfoField label="Daily Hours" value={`${selectedUser.avg_daily_hours} hrs`} />
                                    <InfoField label="Experience" value={`${selectedUser.experience_months} months`} />
                                </div>
                            </div>

                            {/* Location Data */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Location Data</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoField label="Address" value={selectedUser.registered_address} />
                                    <InfoField
                                        label="Coordinates"
                                        value={`${selectedUser.registered_latitude}, ${selectedUser.registered_longitude}`}
                                    />
                                </div>
                            </div>

                            {/* Summary Stats */}
                            {selectedUser.summary && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Account Summary</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-sm text-blue-600 font-semibold">Total Policies</p>
                                            <p className="text-2xl font-bold text-blue-900">{selectedUser.summary.total_policies}</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-green-600 font-semibold">Total Claims</p>
                                            <p className="text-2xl font-bold text-green-900">{selectedUser.summary.total_claims}</p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <p className="text-sm text-purple-600 font-semibold">Risk Score</p>
                                            <p className="text-2xl font-bold text-purple-900">{selectedUser.user_risk_score?.toFixed(0) || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
                            <Button
                                variant="success"
                                onClick={() => handleApprove(selectedUser.id)}
                                disabled={actionLoading}
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="h-5 w-5" />
                                Approve User
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => handleReject(selectedUser.id)}
                                disabled={actionLoading}
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                <XCircle className="h-5 w-5" />
                                Reject User
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function UsersTab() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('active')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        fetchUsers()
    }, [search, statusFilter, page])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            console.log('Fetching users with params:', { page, size: 20, search, statusFilter })
            const result = await adminService.getUsers(page, 20, search, statusFilter)
            console.log('Users API response:', result)
            // The API returns { total, page, size, data: [...] }
            setUsers(result?.data || [])
            setTotal(result?.total || 0)
            console.log('Users set:', result?.data?.length || 0, 'Total:', result?.total || 0)
        } catch (err) {
            console.error('Failed to load users:', err)
            setUsers([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    const handleBlacklist = async (userId: number) => {
        if (!confirm('Blacklist this user?')) return
        try {
            await adminService.blacklistUser(userId, 'Admin blacklist')
            fetchUsers()
            alert('User blacklisted')
        } catch (err) {
            alert('Failed to blacklist user')
        }
    }

    const handleWhitelist = async (userId: number) => {
        if (!confirm('Remove blacklist?')) return
        try {
            await adminService.whitelistUser(userId)
            fetchUsers()
            alert('User whitelisted')
        } catch (err) {
            alert('Failed to whitelist user')
        }
    }

    return (
        <div className="space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blacklisted">Blacklisted</option>
                </select>
            </div>

            {/* Users Table */}
            {loading ? (
                <LoadingSpinner />
            ) : users.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Platform</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Income</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Risk Score</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fraud Flags</th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{user.name}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{user.platform}</td>
                                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                                            {formatters.currency(user.avg_daily_income)}
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${user.risk_score < 30 ? 'bg-green-500' :
                                                            user.risk_score < 60 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                        style={{ width: `${Math.min(user.risk_score, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-gray-900 font-semibold text-xs w-8">
                                                    {user.risk_score.toFixed(0)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            {user.fraud_flags > 0 ? (
                                                <StatusBadge status="flagged" />
                                            ) : (
                                                <span className="text-gray-600">0</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-center text-sm space-x-2">
                                            {user.is_blacklisted ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleWhitelist(user.id)}
                                                >
                                                    Whitelist
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleBlacklist(user.id)}
                                                >
                                                    Blacklist
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} users
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page * 20 >= total}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <EmptyState title="No users found" description="Try adjusting your search filters" />
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLAIMS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function ClaimsTab() {
    const [claims, setClaims] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [statusFilter, setStatusFilter] = useState('')
    const [triggerFilter, setTriggerFilter] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        fetchClaims()
    }, [statusFilter, triggerFilter, page])

    const fetchClaims = async () => {
        try {
            setLoading(true)
            const result = await adminService.getClaims(page, 20, statusFilter || undefined, triggerFilter || undefined)
            setClaims(result?.data || [])
            setTotal(result?.total || 0)
        } catch (err) {
            console.error('Failed to load claims:', err)
            setClaims([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    const triggerTypes = ['rain', 'flood', 'hail', 'accident', 'emergency']

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="pending">Pending</option>
                    <option value="fraud_review">Fraud Review</option>
                </select>
                <select
                    value={triggerFilter}
                    onChange={(e) => {
                        setTriggerFilter(e.target.value)
                        setPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="">All Triggers</option>
                    {triggerTypes.map(type => (
                        <option key={type} value={type}>{type.toUpperCase()}</option>
                    ))}
                </select>
            </div>

            {/* Claims Table */}
            {loading ? (
                <LoadingSpinner />
            ) : claims.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Claim ID</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Trigger</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fraud Score</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {claims.map(claim => (
                                    <tr key={claim.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{claim.id}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{claim.user_name}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600 uppercase font-medium">{claim.trigger_type}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                            {formatters.currency(claim.amount_claimed)}
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${claim.fraud_score < 0.4 ? 'bg-green-500' :
                                                            claim.fraud_score < 0.65 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                        style={{ width: `${Math.min(claim.fraud_score * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-gray-900 font-semibold text-xs">
                                                    {(claim.fraud_score * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            <StatusBadge status={claim.status === 'approved' ? 'approved' : 'flagged'} />
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">
                                            {formatters.formatDate(claim.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} claims
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page * 20 >= total}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <EmptyState title="No claims found" />
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRAUD QUEUE TAB
// ═══════════════════════════════════════════════════════════════════════════════

function FraudQueueTab() {
    const [claims, setClaims] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [riskFilter, setRiskFilter] = useState('')
    const [selectedClaim, setSelectedClaim] = useState<any>(null)
    const [notes, setNotes] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchQueue()
    }, [riskFilter, page])

    const fetchQueue = async () => {
        try {
            setLoading(true)
            const result = await adminService.getFlaggedClaims(page, 20, riskFilter || undefined)
            setClaims(result?.data || [])
            setTotal(result?.total || 0)
        } catch (err) {
            console.error('Failed to load fraud queue:', err)
            setClaims([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (claimId: number) => {
        setActionLoading(true)
        try {
            await adminService.approveFlaggedClaim(claimId, notes || undefined)
            setClaims(claims.filter(c => c.id !== claimId))
            setSelectedClaim(null)
            setNotes('')
            alert('Claim approved')
        } catch (err) {
            alert('Failed to approve claim')
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async (claimId: number) => {
        setActionLoading(true)
        try {
            await adminService.rejectFlaggedClaim(claimId, notes || undefined)
            setClaims(claims.filter(c => c.id !== claimId))
            setSelectedClaim(null)
            setNotes('')
            alert('Claim rejected')
        } catch (err) {
            alert('Failed to reject claim')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Claims List */}
            <div className="lg:col-span-2">
                {/* Filter */}
                <div className="mb-4">
                    <select
                        value={riskFilter}
                        onChange={(e) => {
                            setRiskFilter(e.target.value)
                            setPage(1)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="">All Risk Levels</option>
                        <option value="high">High Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="low">Low Risk</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : claims.length > 0 ? (
                    <div className="space-y-2">
                        {claims.map(claim => (
                            <div
                                key={claim.id}
                                onClick={() => setSelectedClaim(claim)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedClaim?.id === claim.id
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">Claim #{claim.claim_id}</p>
                                        <p className="text-sm text-gray-600">{claim.user_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${claim.risk_level === 'HIGH' ? 'text-red-600' :
                                            claim.risk_level === 'MEDIUM' ? 'text-yellow-600' :
                                                'text-green-600'
                                            }`}>
                                            {(claim.fraud_score * 100).toFixed(0)}%
                                        </div>
                                        <p className="text-xs text-gray-600">{claim.trigger_type}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Fraud queue is empty" description="No claims pending review" />
                )}

                {total > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Page {page} of {Math.ceil(total / 20)}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page * 20 >= total}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Claim Detail & Actions */}
            {selectedClaim ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24 h-fit">
                    <h3 className="font-bold text-gray-900 mb-4">Claim Details</h3>
                    <div className="space-y-4 mb-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Claim ID</p>
                            <p className="text-lg font-bold text-gray-900">#{selectedClaim.claim_id}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">User</p>
                            <p className="font-medium text-gray-900">{selectedClaim.user_name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Amount</p>
                            <p className="font-medium text-gray-900">{formatters.currency(selectedClaim.amount_claimed)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Fraud Score</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${selectedClaim.fraud_score < 0.5 ? 'bg-yellow-500' :
                                            selectedClaim.fraud_score < 0.75 ? 'bg-orange-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{ width: `${selectedClaim.fraud_score * 100}%` }}
                                    />
                                </div>
                                <span className="font-semibold">{(selectedClaim.fraud_score * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Triggers</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedClaim.flags?.length > 0 ? (
                                    selectedClaim.flags.map((flag: string) => (
                                        <span key={flag} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                            {flag}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-600">No flags</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Admin Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes for approval/rejection..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={4}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="success"
                            onClick={() => handleApprove(selectedClaim.id)}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => handleReject(selectedClaim.id)}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <XCircle className="h-4 w-4" />
                            Reject
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6 flex items-center justify-center h-fit">
                    <p className="text-gray-600 text-center">Select a claim to view details</p>
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCIAL CONFIG TAB
// ═══════════════════════════════════════════════════════════════════════════════

function FinancialConfigTab() {
    const [thresholds, setThresholds] = useState<any>(null)
    const [editing, setEditing] = useState(false)
    const [formData, setFormData] = useState<any>({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchThresholds()
    }, [])

    const fetchThresholds = async () => {
        try {
            const result = await adminService.getThresholds()
            setThresholds(result)
            setFormData(result)
        } catch (err) {
            console.error('Failed to load thresholds:', err)
        }
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            await adminService.updateThresholds(formData)
            setThresholds(formData)
            setEditing(false)
            alert('Configuration updated successfully')
        } catch (err) {
            alert('Failed to update configuration')
        } finally {
            setLoading(false)
        }
    }

    if (!thresholds) return <LoadingSpinner />

    return (
        <div className="max-w-2xl">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Fraud Detection Thresholds</h2>
                    <Button
                        variant={editing ? 'secondary' : 'primary'}
                        onClick={() => {
                            if (editing) {
                                setFormData(thresholds)
                            }
                            setEditing(!editing)
                        }}
                    >
                        {editing ? 'Cancel' : 'Edit'}
                    </Button>
                </div>

                <div className="space-y-6">
                    <ConfigField
                        label="Fraud Flag Threshold"
                        description="Fraud score at which claims are flagged for manual review"
                        value={formData.fraud_flag_threshold}
                        onChange={(val) => setFormData({ ...formData, fraud_flag_threshold: val })}
                        disabled={!editing}
                        hint="0.0 - 1.0 (Default: 0.65)"
                    />

                    <ConfigField
                        label="Blacklist Threshold"
                        description="Number of fraud flags before user is blacklisted"
                        value={formData.blacklist_threshold}
                        onChange={(val) => setFormData({ ...formData, blacklist_threshold: parseInt(val) || 0 })}
                        disabled={!editing}
                        hint="Default: 3"
                    />

                    <ConfigField
                        label="Minimum Income for Coverage"
                        description="Minimum daily income required for policy eligibility"
                        value={formData.min_income_coverage}
                        onChange={(val) => setFormData({ ...formData, min_income_coverage: parseInt(val) || 0 })}
                        disabled={!editing}
                        hint="Default: 500 (INR)"
                        currency
                    />

                    <ConfigField
                        label="Minimum Experience (Months)"
                        description="Minimum delivery experience required for coverage"
                        value={formData.min_experience_months}
                        onChange={(val) => setFormData({ ...formData, min_experience_months: parseInt(val) || 0 })}
                        disabled={!editing}
                        hint="Default: 3"
                    />
                </div>

                {editing && (
                    <div className="mt-8 flex gap-3">
                        <Button
                            variant="success"
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1"
                        >
                            Save Changes
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setEditing(false)
                                setFormData(thresholds)
                            }}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            {/* Current Rules Engine */}
            <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
                <div className="flex gap-2 mb-3">
                    <Sliders className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">Rules Engine</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                    <p>• Claims with fraud score ≥ {formData.fraud_flag_threshold} are flagged for review</p>
                    <p>• Users with ≥ {formData.blacklist_threshold} fraud flags are automatically blacklisted</p>
                    <p>• Users must have ₹{formData.min_income_coverage} minimum daily income</p>
                    <p>• Users must have {formData.min_experience_months}+ months experience</p>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATOR TAB
// ═══════════════════════════════════════════════════════════════════════════════

function SimulatorTab() {
    const [userId, setUserId] = useState('')
    const [triggerType, setTriggerType] = useState('rain')
    const [severity, setSeverity] = useState(0.5)
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const triggerTypes = [
        { id: 'rain', label: 'Heavy Rain', icon: '🌧️' },
        { id: 'flood', label: 'Flood', icon: '🌊' },
        { id: 'hail', label: 'Hail Storm', icon: '❄️' },
        { id: 'accident', label: 'Accident', icon: '🚨' },
    ]

    const handleSimulate = async () => {
        if (!userId) {
            alert('Please enter a user ID')
            return
        }

        try {
            setLoading(true)
            const simulation = {
                user_id: parseInt(userId),
                trigger_type: triggerType,
                severity,
                location: { latitude: 0, longitude: 0 },
                note: notes,
            }
            const response = await adminService.simulateTrigger(simulation)
            setResult(response?.data)
        } catch (err) {
            alert('Failed to simulate trigger')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
            {/* Input Form */}
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">User ID</label>
                    <input
                        type="number"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter user ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Trigger Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        {triggerTypes.map(trigger => (
                            <button
                                key={trigger.id}
                                onClick={() => setTriggerType(trigger.id)}
                                className={`p-3 rounded-lg border-2 font-medium transition-colors ${triggerType === trigger.id
                                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-xl mr-2">{trigger.icon}</span>
                                {trigger.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Severity</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={severity}
                        onChange={(e) => setSeverity(parseFloat(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>Low</span>
                        <span className="font-semibold">{(severity * 100).toFixed(0)}%</span>
                        <span>High</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional simulation notes..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                    />
                </div>

                <Button
                    onClick={handleSimulate}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2"
                >
                    <Zap className="h-5 w-5" />
                    Simulate Trigger
                </Button>
            </div>

            {/* Results */}
            {result && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <h3 className="text-lg font-bold text-green-900">Simulation Complete</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-green-700 uppercase">Claim ID</p>
                            <p className="text-2xl font-bold text-green-900">#{result.claim_id}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-green-700 uppercase">Trigger Type</p>
                            <p className="font-medium text-green-900">{result.trigger_type}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-green-700 uppercase">Status</p>
                            <p className="font-medium text-green-900 capitalize">{result.status}</p>
                        </div>
                        <p className="text-sm text-green-700 mt-4 p-3 bg-white rounded">
                            Test claim created successfully. Monitor the fraud queue for automatic processing.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function MetricBox({
    label,
    value,
    color = 'gray',
    status,
}: {
    label: string
    value: string | number
    color?: string
    status?: string
}) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 text-blue-600',
        green: 'bg-green-50 border-green-200 text-green-600',
        red: 'bg-red-50 border-red-200 text-red-600',
        purple: 'bg-purple-50 border-purple-200 text-purple-600',
        amber: 'bg-amber-50 border-amber-200 text-amber-600',
        gray: 'bg-gray-50 border-gray-200 text-gray-600',
    }

    return (
        <div className={`rounded-lg border-2 p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {status && <p className="text-xs mt-2 opacity-75 capitalize">{status}</p>}
        </div>
    )
}

function ConfigField({
    label,
    description,
    value,
    onChange,
    disabled,
    hint,
    currency,
}: {
    label: string
    description: string
    value: any
    onChange: (value: any) => void
    disabled: boolean
    hint?: string
    currency?: boolean
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">{label}</label>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            <div className="flex items-center gap-2">
                {currency && <span className="text-gray-600">₹</span>}
                <input
                    type={currency || label.includes('Threshold') && label.includes('Fraud') ? 'number' : 'number'}
                    step={currency || label.includes('Fraud') ? '0.01' : '1'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>
            {hint && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
        </div>
    )
}

function InfoField({ label, value }: { label: string; value: any }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">{label}</p>
            <p className="text-sm text-gray-900 font-medium">{value || 'N/A'}</p>
        </div>
    )
}

export default AdminCenter
