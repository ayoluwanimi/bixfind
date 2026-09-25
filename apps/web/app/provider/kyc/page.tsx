'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  User,
  CreditCard,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Camera,
  FileText,
  AlertTriangle,
  Clock,
  XCircle,
  Loader2,
  Check,
  Eye,
} from 'lucide-react'
import { storage } from '@/lib/storage'
import { toast } from 'sonner'

type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected'

interface KycData {
  status: KycStatus
  submittedAt?: string
  reviewedAt?: string
  rejectReason?: string
  step1: {
    fullName: string
    dateOfBirth: string
    phone: string
    street: string
    city: string
    state: string
    country: string
    businessName: string
  }
  step2: {
    idType: string
    idNumber: string
    idDocument: string
    selfie: string
  }
  step3: {
    businessRegNumber: string
    businessAddress: string
    taxId: string
    utilityBill: string
  }
  confirmed: boolean
}

const defaultKycData: KycData = {
  status: 'not_submitted',
  step1: { fullName: '', dateOfBirth: '', phone: '', street: '', city: '', state: '', country: '', businessName: '' },
  step2: { idType: '', idNumber: '', idDocument: '', selfie: '' },
  step3: { businessRegNumber: '', businessAddress: '', taxId: '', utilityBill: '' },
  confirmed: false,
}

const STEPS = [
  { label: 'Personal Info', icon: User },
  { label: 'Identity', icon: CreditCard },
  { label: 'Business', icon: Building2 },
  { label: 'Review', icon: CheckCircle2 },
]

const STATUS_CONFIG: Record<KycStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  not_submitted: { label: 'Not Submitted', color: 'text-white/60', bg: 'bg-white/10', icon: FileText },
  pending: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Clock },
  verified: { label: 'Verified', color: 'text-green-400', bg: 'bg-green-500/20', icon: ShieldCheck },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
}

function FileUpload({ label, file, onUpload, icon: Icon }: { label: string; file: string; onUpload: (data: string) => void; icon: React.ElementType }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result) onUpload(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="block text-sm text-white/60 mb-1">{label}</label>
      {file ? (
        <div className="relative rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          {file.startsWith('data:image') ? (
            <img src={file} alt={label} className="w-full h-40 object-cover" />
          ) : (
            <div className="flex items-center gap-3 p-4">
              <FileText className="w-8 h-8 text-blue-400" />
              <span className="text-white/60 text-sm truncate">Document uploaded</span>
            </div>
          )}
          <button
            onClick={() => onUpload('')}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/60 hover:text-white transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
          <Icon className="w-8 h-8 text-white/30" />
          <span className="text-white/40 text-sm">Click to upload</span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleChange} />
        </label>
      )}
    </div>
  )
}

export default function ProviderKycPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [kycData, setKycData] = useState<KycData>(defaultKycData)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const currentUser = storage.getUser()
    if (!currentUser || (currentUser.user_metadata?.user_type || currentUser.userType) !== 'provider') {
      router.push('/login')
      return
    }
    setUser(currentUser)

    // Load KYC status from database
    fetch('/api/provider/kyc', { signal: AbortSignal.timeout(8000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.kyc_status && data.kyc_status !== 'not_submitted') {
          setKycData({
            status: data.kyc_status as KycStatus,
            submittedAt: data.kyc_submitted_at,
            reviewedAt: data.kyc_verified_at,
            rejectReason: data.kyc_rejection_reason,
            step1: {
              fullName: data.kyc_full_name || currentUser.user_metadata?.full_name || '',
              dateOfBirth: data.kyc_dob || '',
              phone: data.kyc_phone || currentUser.phone || '',
              street: data.kyc_address || '',
              city: data.kyc_city || '',
              state: data.kyc_state || '',
              country: data.kyc_country || '',
              businessName: data.kyc_business_name || '',
            },
            step2: {
              idType: data.kyc_id_type || '',
              idNumber: data.kyc_id_number || '',
              idDocument: data.kyc_id_document || '',
              selfie: data.kyc_selfie || '',
            },
            step3: {
              businessRegNumber: data.kyc_reg_number || '',
              businessAddress: data.kyc_business_address || '',
              taxId: data.kyc_tax_id || '',
              utilityBill: data.kyc_utility_bill || '',
            },
            confirmed: false,
          })
          if (data.kyc_status === 'verified' || data.kyc_status === 'pending') {
            setSubmitted(true)
          }
        } else {
          // Fallback to localStorage
          const existing = storage.get('provider_kyc') as KycData | null
          if (existing) {
            setKycData(existing)
            if (existing.status === 'verified' || existing.status === 'pending') {
              setSubmitted(true)
            }
          } else {
            setKycData(d => ({
              ...d,
              step1: {
                ...d.step1,
                fullName: currentUser.user_metadata?.full_name || currentUser.fullName || currentUser.name || '',
                phone: currentUser.phone || '',
              },
            }))
          }
        }
      })
      .catch(() => {
        const existing = storage.get('provider_kyc') as KycData | null
        if (existing) {
          setKycData(existing)
          if (existing.status === 'verified' || existing.status === 'pending') setSubmitted(true)
        } else {
          setKycData(d => ({
            ...d,
            step1: {
              ...d.step1,
              fullName: currentUser.user_metadata?.full_name || currentUser.fullName || currentUser.name || '',
              phone: currentUser.phone || '',
            },
          }))
        }
      })
      .finally(() => setLoading(false))

    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const updateStep1 = useCallback((field: string, value: string) => {
    setKycData(d => ({ ...d, step1: { ...d.step1, [field]: value } }))
    setErrors(e => ({ ...e, [field]: '' }))
  }, [])

  const updateStep2 = useCallback((field: string, value: string) => {
    setKycData(d => ({ ...d, step2: { ...d.step2, [field]: value } }))
    setErrors(e => ({ ...e, [field]: '' }))
  }, [])

  const updateStep3 = useCallback((field: string, value: string) => {
    setKycData(d => ({ ...d, step3: { ...d.step3, [field]: value } }))
  }, [])

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 0) {
      if (!kycData.step1.fullName.trim()) errs.fullName = 'Full name is required'
      if (!kycData.step1.phone.trim()) errs.phone = 'Phone number is required'
      if (!kycData.step1.dateOfBirth) errs.dateOfBirth = 'Date of birth is required'
      if (!kycData.step1.country.trim()) errs.country = 'Country is required'
    }
    if (s === 1) {
      if (!kycData.step2.idType) errs.idType = 'Select an ID type'
      if (!kycData.step2.idNumber.trim()) errs.idNumber = 'ID number is required'
      if (!kycData.step2.idDocument) errs.idDocument = 'Upload your ID document'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => {
    if (validateStep(step) && step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        kyc_full_name: kycData.step1.fullName,
        kyc_dob: kycData.step1.dateOfBirth,
        kyc_phone: kycData.step1.phone,
        kyc_address: kycData.step1.street,
        kyc_city: kycData.step1.city,
        kyc_state: kycData.step1.state,
        kyc_country: kycData.step1.country,
        kyc_business_name: kycData.step1.businessName,
        kyc_id_type: kycData.step2.idType,
        kyc_id_number: kycData.step2.idNumber,
        kyc_id_document: kycData.step2.idDocument,
        kyc_selfie: kycData.step2.selfie,
        kyc_reg_number: kycData.step3.businessRegNumber,
        kyc_business_address: kycData.step3.businessAddress,
        kyc_tax_id: kycData.step3.taxId,
        kyc_utility_bill: kycData.step3.utilityBill,
      }

      const res = await fetch('/api/provider/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Submission failed')
      }

      const finalData = { ...kycData, status: 'pending' as KycStatus, submittedAt: new Date().toISOString() }
      storage.set('provider_kyc', finalData)
      setKycData(finalData)
      setSubmitted(true)
      toast.success('KYC submitted successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit KYC')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded w-48 mb-4" />
          <div className="h-4 bg-white/10 rounded w-80" />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 animate-pulse">
          <div className="flex gap-4 mb-8">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 w-10 bg-white/10 rounded-full" />)}</div>
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-white/10 rounded-xl" />)}</div>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[kycData.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6 max-w-3xl" suppressHydrationWarning>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" /> KYC Verification
          </h1>
          <p className="text-white/50 mt-1">Verify your identity to unlock all features</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${statusConfig.bg} border border-white/10`}>
        <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
        <div className="flex-1">
          <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
          {kycData.submittedAt && (
            <span className="text-xs text-white/40 ml-2">Submitted {new Date(kycData.submittedAt).toLocaleDateString()}</span>
          )}
        </div>
        {kycData.status === 'rejected' && (
          <button onClick={() => { setKycData(d => ({ ...d, status: 'not_submitted' })); setSubmitted(false); setStep(0) }} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors">
            Re-submit
          </button>
        )}
      </motion.div>

      {kycData.status === 'rejected' && kycData.rejectReason && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Rejection Reason</p>
              <p className="text-sm text-white/60 mt-1">{kycData.rejectReason}</p>
            </div>
          </div>
        </motion.div>
      )}

      {submitted && kycData.status !== 'rejected' ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${kycData.status === 'verified' ? 'bg-green-500/20' : 'bg-amber-500/20'}`}
          >
            {kycData.status === 'verified' ? (
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            ) : (
              <Clock className="w-10 h-10 text-amber-400" />
            )}
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {kycData.status === 'verified' ? 'You are verified!' : 'Verification in Progress'}
          </h3>
          <p className="text-white/50 text-sm">
            {kycData.status === 'verified'
              ? 'Your identity has been confirmed. You now have full access to all features.'
              : 'Your documents are being reviewed. This usually takes 1-3 business days.'}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Step Indicator */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => {
                const StepIcon = s.icon
                const isActive = i === step
                const isCompleted = i < step
                return (
                  <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{ scale: isActive ? 1.1 : 1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          isCompleted ? 'bg-blue-600 text-white' : isActive ? 'bg-blue-600/20 text-blue-400 border-2 border-blue-500' : 'bg-white/10 text-white/40'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                      </motion.div>
                      <span className={`text-xs mt-2 whitespace-nowrap ${isActive ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full mt-[-16px] ${i < step ? 'bg-blue-600' : 'bg-white/10'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Full Name *</label>
                    <input value={kycData.step1.fullName} onChange={e => updateStep1('fullName', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${errors.fullName ? 'border-red-500/50' : 'border-white/10'} text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors`} placeholder="John Doe" />
                    {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Date of Birth *</label>
                      <input type="date" value={kycData.step1.dateOfBirth} onChange={e => updateStep1('dateOfBirth', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${errors.dateOfBirth ? 'border-red-500/50' : 'border-white/10'} text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors`} />
                      {errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Phone Number *</label>
                      <input value={kycData.step1.phone} onChange={e => updateStep1('phone', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${errors.phone ? 'border-red-500/50' : 'border-white/10'} text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors`} placeholder="+234..." />
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Street Address</label>
                    <input value={kycData.step1.street} onChange={e => updateStep1('street', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="123 Main Street" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1">City</label>
                      <input value={kycData.step1.city} onChange={e => updateStep1('city', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Lagos" />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">State</label>
                      <input value={kycData.step1.state} onChange={e => updateStep1('state', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Lagos" />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Country *</label>
                      <input value={kycData.step1.country} onChange={e => updateStep1('country', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${errors.country ? 'border-red-500/50' : 'border-white/10'} text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors`} placeholder="Nigeria" />
                      {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Business Name (if applicable)</label>
                    <input value={kycData.step1.businessName} onChange={e => updateStep1('businessName', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="My Business Ltd" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white mb-4">Identity Verification</h2>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">ID Type *</label>
                    <select value={kycData.step2.idType} onChange={e => updateStep2('idType', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${errors.idType ? 'border-red-500/50' : 'border-white/10'} text-white focus:outline-none focus:border-blue-500/50 transition-colors`}>
                      <option value="" className="bg-gray-900">Select ID type</option>
                      <option value="national_id" className="bg-gray-900">National ID</option>
                      <option value="passport" className="bg-gray-900">Passport</option>
                      <option value="drivers_license" className="bg-gray-900">Driver&apos;s License</option>
                      <option value="voters_card" className="bg-gray-900">Voter&apos;s Card</option>
                    </select>
                    {errors.idType && <p className="text-red-400 text-xs mt-1">{errors.idType}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">ID Number *</label>
                    <input value={kycData.step2.idNumber} onChange={e => updateStep2('idNumber', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border ${errors.idNumber ? 'border-red-500/50' : 'border-white/10'} text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors`} placeholder="Enter your ID number" />
                    {errors.idNumber && <p className="text-red-400 text-xs mt-1">{errors.idNumber}</p>}
                  </div>
                  <FileUpload label="ID Document *" file={kycData.step2.idDocument} onUpload={v => updateStep2('idDocument', v)} icon={Upload} />
                  {errors.idDocument && <p className="text-red-400 text-xs">{errors.idDocument}</p>}
                  <FileUpload label="Selfie (for verification)" file={kycData.step2.selfie} onUpload={v => updateStep2('selfie', v)} icon={Camera} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white mb-4">Business Verification</h2>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Business Registration Number (optional)</label>
                    <input value={kycData.step3.businessRegNumber} onChange={e => updateStep3('businessRegNumber', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="RC123456" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Business Address</label>
                    <input value={kycData.step3.businessAddress} onChange={e => updateStep3('businessAddress', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Business address" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Tax ID / VAT Number (optional)</label>
                    <input value={kycData.step3.taxId} onChange={e => updateStep3('taxId', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="VAT123456" />
                  </div>
                  <FileUpload label="Utility Bill" file={kycData.step3.utilityBill} onUpload={v => updateStep3('utilityBill', v)} icon={FileText} />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Review & Submit</h2>

                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Personal Information</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-white/40">Full Name:</span> <span className="text-white ml-1">{kycData.step1.fullName || '-'}</span></div>
                        <div><span className="text-white/40">DOB:</span> <span className="text-white ml-1">{kycData.step1.dateOfBirth || '-'}</span></div>
                        <div><span className="text-white/40">Phone:</span> <span className="text-white ml-1">{kycData.step1.phone || '-'}</span></div>
                        <div><span className="text-white/40">Country:</span> <span className="text-white ml-1">{kycData.step1.country || '-'}</span></div>
                        <div><span className="text-white/40">City:</span> <span className="text-white ml-1">{kycData.step1.city || '-'}</span></div>
                        <div><span className="text-white/40">State:</span> <span className="text-white ml-1">{kycData.step1.state || '-'}</span></div>
                        <div className="col-span-2"><span className="text-white/40">Address:</span> <span className="text-white ml-1">{kycData.step1.street || '-'}</span></div>
                        {kycData.step1.businessName && <div className="col-span-2"><span className="text-white/40">Business:</span> <span className="text-white ml-1">{kycData.step1.businessName}</span></div>}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Identity Verification</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-white/40">ID Type:</span> <span className="text-white ml-1">{kycData.step2.idType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-'}</span></div>
                        <div><span className="text-white/40">ID Number:</span> <span className="text-white ml-1">{kycData.step2.idNumber || '-'}</span></div>
                        <div><span className="text-white/40">ID Document:</span> <span className="text-white ml-1">{kycData.step2.idDocument ? 'Uploaded' : 'Not uploaded'}</span></div>
                        <div><span className="text-white/40">Selfie:</span> <span className="text-white ml-1">{kycData.step2.selfie ? 'Uploaded' : 'Not uploaded'}</span></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Business Verification</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-white/40">Reg Number:</span> <span className="text-white ml-1">{kycData.step3.businessRegNumber || 'N/A'}</span></div>
                        <div><span className="text-white/40">Tax ID:</span> <span className="text-white ml-1">{kycData.step3.taxId || 'N/A'}</span></div>
                        <div className="col-span-2"><span className="text-white/40">Business Address:</span> <span className="text-white ml-1">{kycData.step3.businessAddress || '-'}</span></div>
                        <div><span className="text-white/40">Utility Bill:</span> <span className="text-white ml-1">{kycData.step3.utilityBill ? 'Uploaded' : 'Not uploaded'}</span></div>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={kycData.confirmed}
                      onChange={e => setKycData(d => ({ ...d, confirmed: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-white/70">I confirm that all information provided is accurate and the documents are genuine. I understand that providing false information may result in account suspension.</span>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {step < 3 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!kycData.confirmed || submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Submit Verification
                  </>
                )}
              </motion.button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
