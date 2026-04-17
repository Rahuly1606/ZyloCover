import React, { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common'
import { Shield, Copy, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { adminService } from '@/services/adminService'

interface CredentialState {
    credential: string | null
    showCredential: boolean
    copied: boolean
}

export const AdminCredentials = () => {
    const [credentialState, setCredentialState] = useState<CredentialState>({
        credential: null,
        showCredential: false,
        copied: false
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleGenerateCredential = async () => {
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/admin/credentials/generate', {
                method: 'POST',
                headers: {
                    'x_admin_token': localStorage.getItem('admin_token') || '',
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) throw new Error('Failed to generate credential')

            const data = await response.json()
            setCredentialState({
                credential: data.credential,
                showCredential: true,
                copied: false
            })
            setSuccess('New admin credential generated successfully! ⚠️ Copy and save it now - you won\'t see it again!')
        } catch (err: any) {
            setError(err.message || 'Failed to generate credential')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyCredential = () => {
        if (credentialState.credential) {
            navigator.clipboard.writeText(credentialState.credential)
            setCredentialState(prev => ({ ...prev, copied: true }))
            setTimeout(() => {
                setCredentialState(prev => ({ ...prev, copied: false }))
            }, 2000)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <Shield className="h-6 w-6 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Credentials</h1>
                    </div>
                    <p className="text-gray-600">Manage your secure admin access credentials</p>
                </div>

                {/* Alert Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-900">Error</p>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-green-900">Success</p>
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Current Credential Section */}
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Credential</h2>
                        <p className="text-gray-600 mb-6">
                            Your admin credential is a unique security key required to access the admin portal alongside your email and password.
                        </p>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600 mb-2">Status</p>
                                <p className="text-lg font-mono font-semibold text-gray-900">
                                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                        ✓ Credential Configured
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Credential Display Section */}
                    {credentialState.credential && (
                        <div className="p-6 border-b border-gray-200 bg-amber-50">
                            <div className="flex items-start gap-3 mb-4">
                                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-amber-900">⚠️ Important</p>
                                    <p className="text-sm text-amber-800 mt-1">
                                        This is your new admin credential. Save it in a secure location - you will not be able to see it again.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1 p-3 bg-white rounded-lg border border-amber-200 font-mono text-sm break-all text-gray-900">
                                    {credentialState.showCredential ? credentialState.credential : '••••••••••••••••••••••••'}
                                </div>
                                <Button
                                    variant={credentialState.copied ? 'success' : 'secondary'}
                                    onClick={handleCopyCredential}
                                    className="flex-shrink-0"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>

                            {credentialState.copied && (
                                <p className="text-xs text-green-600 mt-2">✓ Copied to clipboard</p>
                            )}
                        </div>
                    )}

                    {/* Actions Section */}
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                        <div className="space-y-3">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Generate New Credential
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Generate a new admin credential. Your old credential will become invalid.
                                </p>
                                <Button
                                    variant="secondary"
                                    onClick={handleGenerateCredential}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? (
                                        <>
                                            <LoadingSpinner />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Generate New Credential
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                        <div className="flex gap-3">
                            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-blue-900 mb-1">Security Information</p>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Credentials are hashed and never stored in plain text</li>
                                    <li>• Each admin has a unique credential key</li>
                                    <li>• Credentials are required in addition to email & password</li>
                                    <li>• Keep your credential safe and never share it</li>
                                    <li>• Regenerate if you suspect compromise</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold">Need help?</span> If you've lost your credential or can't log in, contact your system administrator.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AdminCredentials
