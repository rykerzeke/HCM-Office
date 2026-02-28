import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { MessageSquare, Paperclip, Activity, FileText, UserPlus, Send, History, Play, CheckCircle, AlertTriangle, ImageIcon, X, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const CaseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [commentContent, setCommentContent] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [officials, setOfficials] = useState<any[]>([]);
  const [searchOfficial, setSearchOfficial] = useState('');
  const [stakeholderToRemove, setStakeholderToRemove] = useState<string | null>(null);

  // Minister Meeting Workflow
  const [rejectReason, setRejectReason] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState('');
  const [meetingType, setMeetingType] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [venueOrLink, setVenueOrLink] = useState('');
  const [closureStatus, setClosureStatus] = useState<'COMPLETED' | 'FOLLOW_UP_REQUIRED' | 'RESCHEDULE_REQUIRED'>('COMPLETED');
  const [closureNotes, setClosureNotes] = useState('');
  const [meetingSummary, setMeetingSummary] = useState('');
  const [actionRequired, setActionRequired] = useState('');
  const [responsibleAuthorityId, setResponsibleAuthorityId] = useState('');
  const [workflowBusy, setWorkflowBusy] = useState(false);

  // Resolve without meeting
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Communications
  const [commType, setCommType] = useState<'CALL' | 'LETTER' | 'EMAIL' | 'MEETING_NOTE'>('CALL');
  const [commDirection, setCommDirection] = useState<'INBOUND' | 'OUTBOUND'>('OUTBOUND');
  const [commSummary, setCommSummary] = useState('');
  const [commBusy, setCommBusy] = useState(false);

  // Assignments: create
  const [users, setUsers] = useState<any[]>([]);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignPriority, setAssignPriority] = useState('MEDIUM');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignStatus, setAssignStatus] = useState('PENDING');
  const [assignBusy, setAssignBusy] = useState(false);
  // Assignments: edit
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchCase = useCallback(async () => {
    try {
      const res = await api.get(`/cases/${id}`);
      setCaseData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchOfficials = useCallback(async () => {
    if (!caseData?.id) return;
    try {
      const res = await api.get('/officials');
      setOfficials(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [caseData?.id]);

  useEffect(() => { fetchCase(); }, [fetchCase]);
  useEffect(() => { if (caseData?.id) fetchOfficials(); }, [caseData?.id, fetchOfficials]);
  useEffect(() => {
    if (activeTab === 'assignments') {
      api.get('/users').then(res => setUsers(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    }
  }, [activeTab]);

  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commSummary.trim()) return;
    try {
      setCommBusy(true);
      await api.post(`/cases/${id}/communications`, { type: commType, direction: commDirection, summary: commSummary.trim() });
      setCommSummary('');
      fetchCase();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add communication');
    } finally {
      setCommBusy(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId) return;
    try {
      setAssignBusy(true);
      await api.post(`/cases/${id}/assignments`, {
        userId: assignUserId,
        notes: assignNotes || undefined,
        priority: assignPriority,
        dueDate: assignDueDate || undefined,
        status: assignStatus,
      });
      setAssignUserId('');
      setAssignNotes('');
      setAssignDueDate('');
      setAssignStatus('PENDING');
      fetchCase();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setAssignBusy(false);
    }
  };

  const handleUpdateAssignment = async (assignmentId: string) => {
    try {
      await api.patch(`/cases/${id}/assignments/${assignmentId}`, {
        ...(editDueDate && { dueDate: editDueDate }),
        ...(editStatus && { status: editStatus }),
        ...(editNotes !== undefined && { notes: editNotes }),
      });
      setEditingAssignmentId(null);
      setEditDueDate('');
      setEditStatus('');
      setEditNotes('');
      fetchCase();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update assignment');
    }
  };

  const handleAuthorize = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION' | 'RESOLVE_WITHOUT_MEETING', extra?: { resolutionNotes?: string }) => {
    try {
      setWorkflowBusy(true);
      await api.patch(`/cases/${id}/authorize`, {
        action,
        rejectionReason: action === 'REJECT' ? rejectReason : undefined,
        resolutionNotes: action === 'RESOLVE_WITHOUT_MEETING' ? (extra?.resolutionNotes || resolveNotes) : undefined,
      });
      setRejectReason('');
      setResolveNotes('');
      setShowResolveModal(false);
      fetchCase();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setWorkflowBusy(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleTimeSlot) return;
    try {
      setWorkflowBusy(true);
      await api.patch(`/cases/${id}/schedule`, {
        scheduledDate: scheduleDate,
        scheduledTimeSlot: scheduleTimeSlot,
        meetingType,
        venueOrLink: venueOrLink || undefined,
      });
      setScheduleDate('');
      setScheduleTimeSlot('');
      setVenueOrLink('');
      fetchCase();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Scheduling failed');
    } finally {
      setWorkflowBusy(false);
    }
  };

  const handleCheckIn = async (checkIn: 'ARRIVED' | 'NO_SHOW' | 'RESCHEDULED') => {
    try {
      setWorkflowBusy(true);
      await api.patch(`/cases/${id}/checkin`, { checkIn });
      fetchCase();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Check-in failed');
    } finally {
      setWorkflowBusy(false);
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setWorkflowBusy(true);
      await api.patch(`/cases/${id}/close`, {
        closureStatus,
        closureNotes: closureNotes || undefined,
        meetingSummary: meetingSummary || undefined,
        actionRequired: actionRequired || undefined,
        responsibleAuthorityId: responsibleAuthorityId || undefined,
      });
      setClosureNotes('');
      setMeetingSummary('');
      setActionRequired('');
      setResponsibleAuthorityId('');
      fetchCase();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Closure failed');
    } finally {
      setWorkflowBusy(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() && !commentImage) return;
    try {
      let imageUrl = null;
      if (commentImage) {
        const formData = new FormData();
        formData.append('files', commentImage);
        const res = await api.post(`/cases/${id}/files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.files && res.data.files.length > 0) {
          imageUrl = res.data.files[0].path;
        }
      }
      await api.post(`/cases/${id}/comments`, { content: commentContent, imageUrl });
      setCommentContent('');
      setCommentImage(null);
      fetchCase();
    } catch (err) { console.error(err); }
  };

  const handleMapStakeholder = async (officialIdToMap: string) => {
    try {
      await api.post(`/cases/${id}/stakeholders`, { officialId: officialIdToMap });
      fetchCase();
    } catch (err) { console.error(err); }
  };

  const handleRemoveStakeholder = async () => {
    if (!stakeholderToRemove) return;
    try {
      await api.delete(`/cases/${id}/stakeholders/${stakeholderToRemove}`);
      setStakeholderToRemove(null);
      fetchCase();
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('files', e.target.files[i]);
    }
    try {
      await api.post(`/cases/${id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchCase();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }
  if (!caseData) return <div className="text-surface-400">Case not found</div>;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'stakeholders', name: 'Stakeholders', icon: UserPlus },
    { id: 'assignments', name: 'Assignments', icon: Calendar, count: caseData.assignments?.length },
    { id: 'comments', name: 'Comments', icon: MessageSquare, count: caseData.comments?.length },
    { id: 'communications', name: 'Communications', icon: Phone, count: caseData.communicationLogs?.length },
    { id: 'files', name: 'Documents', icon: Paperclip, count: caseData.files?.length },
    { id: 'audit', name: 'Audit Trail', icon: History },
  ];
  const uploadsBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-mono">{caseData.caseId}</h1>
            <StatusBadge status={caseData.status} />
            <PriorityBadge priority={caseData.priority} />
          </div>
          <p className="text-sm text-surface-400 mt-1">
            Requested by <span className="text-surface-300 font-medium">{caseData.citizen?.name}</span> on {format(new Date(caseData.createdAt), 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* 2. Authorization: Pending Approval / On Hold */}
          {(caseData.status === 'PENDING_APPROVAL' || caseData.status === 'ON_HOLD') && (
            <>
              <button onClick={() => handleAuthorize('APPROVE')} disabled={workflowBusy} className="btn-ghost inline-flex items-center gap-2 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
              <button onClick={() => setShowResolveModal(true)} disabled={workflowBusy} className="btn-ghost inline-flex items-center gap-2 text-teal-400 border-teal-500/20 hover:bg-teal-500/10">
                <CheckCircle className="h-4 w-4" /> Resolve without meeting
              </button>
              <button onClick={() => handleAuthorize('REQUEST_CLARIFICATION')} disabled={workflowBusy} className="btn-ghost inline-flex items-center gap-2 text-amber-400 border-amber-500/20 hover:bg-amber-500/10">
                <AlertTriangle className="h-4 w-4" /> Request Clarification
              </button>
              <div className="inline-flex items-center gap-1">
                <input type="text" placeholder="Rejection reason..." className="input-dark w-48 text-sm" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                <button onClick={() => handleAuthorize('REJECT')} disabled={workflowBusy} className="btn-ghost text-rose-400 border-rose-500/20 hover:bg-rose-500/10">Reject</button>
              </div>
            </>
          )}
          {/* 3. Scheduling: Approved */}
          {caseData.status === 'APPROVED' && (
            <form onSubmit={handleSchedule} className="flex flex-wrap items-center gap-2">
              <input type="date" className="input-dark text-sm" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} required />
              <input type="text" placeholder="Time slot (e.g. 10:00-10:30)" className="input-dark w-40 text-sm" value={scheduleTimeSlot} onChange={e => setScheduleTimeSlot(e.target.value)} required />
              <select className="select-dark text-sm w-32" value={meetingType} onChange={e => setMeetingType(e.target.value as any)}>
                <option value="IN_PERSON">In-person</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
              <input type="text" placeholder="Venue / Link" className="input-dark w-40 text-sm" value={venueOrLink} onChange={e => setVenueOrLink(e.target.value)} />
              <button type="submit" disabled={workflowBusy} className="btn-primary text-sm">Schedule</button>
            </form>
          )}
          {/* 5. Visit day check-in: only when scheduled and no check-in recorded yet */}
          {caseData.status === 'SCHEDULED' && !caseData.visitCheckIn && (
            <>
              <button onClick={() => handleCheckIn('ARRIVED')} disabled={workflowBusy} className="btn-ghost inline-flex items-center gap-2 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                <CheckCircle className="h-4 w-4" /> Arrived
              </button>
              <button onClick={() => handleCheckIn('NO_SHOW')} disabled={workflowBusy} className="btn-ghost inline-flex items-center gap-2 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">
                No-show
              </button>
              <button onClick={() => handleCheckIn('RESCHEDULED')} disabled={workflowBusy} className="btn-ghost inline-flex items-center gap-2 text-amber-400 border-amber-500/20 hover:bg-amber-500/10">
                Rescheduled
              </button>
            </>
          )}
          {/* 6. Post-meeting closure: when scheduled or any check-in recorded (matches backend: visitCheckIn != null) */}
          {(caseData.status === 'SCHEDULED' || caseData.visitCheckIn != null) && (
            <form onSubmit={handleClose} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <select className="select-dark text-sm w-44" value={closureStatus} onChange={e => setClosureStatus(e.target.value as any)}>
                  <option value="COMPLETED">Completed</option>
                  <option value="FOLLOW_UP_REQUIRED">Follow-up required</option>
                  <option value="RESCHEDULE_REQUIRED">Reschedule required</option>
                </select>
                <input type="text" placeholder="Closure notes" className="input-dark w-48 text-sm" value={closureNotes} onChange={e => setClosureNotes(e.target.value)} />
                <button type="submit" disabled={workflowBusy} className="btn-primary text-sm">Close</button>
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <input type="text" placeholder="Meeting summary" className="input-dark w-56 text-sm" value={meetingSummary} onChange={e => setMeetingSummary(e.target.value)} />
                <input type="text" placeholder="Action required" className="input-dark w-56 text-sm" value={actionRequired} onChange={e => setActionRequired(e.target.value)} />
                <select className="select-dark text-sm w-48" value={responsibleAuthorityId} onChange={e => setResponsibleAuthorityId(e.target.value)}>
                  <option value="">Responsible authority (optional)</option>
                  {officials.map((o: any) => <option key={o.id} value={o.id}>{o.name} – {o.designation}</option>)}
                </select>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="border-b border-white/5 overflow-x-auto">
          <nav className="flex px-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 whitespace-nowrap px-5 py-4 text-sm font-medium border-b-2 transition-all
                    ${isActive
                      ? 'border-primary-500 text-white'
                      : 'border-transparent text-surface-500 hover:text-surface-300 hover:border-surface-600'}
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary-400' : ''}`} />
                  {tab.name}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-surface-800 text-[10px] font-semibold text-surface-400">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">Request Purpose</h3>
                  <p className="text-sm text-surface-200 whitespace-pre-wrap glass-light rounded-xl p-5 leading-relaxed">{caseData.purpose}</p>
                </div>
                {caseData.category && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Category</h3>
                    <p className="text-sm text-surface-300">{caseData.category.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {(caseData.referringOfficer || caseData.referenceMode) && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Reference</h3>
                    <p className="text-sm text-surface-300">
                      {caseData.referringOfficer && <span>Referring Officer: <span className="text-white">{caseData.referringOfficer.replace(/_/g, ' ')}</span></span>}
                      {caseData.referringOfficer && caseData.referenceMode && ' · '}
                      {caseData.referenceMode && <span>Mode: <span className="text-white">{caseData.referenceMode}</span></span>}
                    </p>
                  </div>
                )}
                {caseData.rejectionReason && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Rejection Reason</h3>
                    <p className="text-sm text-rose-300 glass-light rounded-xl p-4">{caseData.rejectionReason}</p>
                  </div>
                )}
                {(caseData.scheduledDate || caseData.scheduledTimeSlot) && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Scheduled Meeting</h3>
                    <p className="text-sm text-surface-300">
                      {caseData.scheduledDate && format(new Date(caseData.scheduledDate), 'PPP')}
                      {caseData.scheduledTimeSlot && ` · ${caseData.scheduledTimeSlot}`}
                      {caseData.meetingType && ` · ${caseData.meetingType.replace('_', '-')}`}
                    </p>
                    {caseData.venueOrLink && <p className="text-sm text-primary-400 mt-1">{caseData.venueOrLink}</p>}
                  </div>
                )}
                {caseData.visitCheckIn && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Visit Check-in</h3>
                    <p className="text-sm text-surface-300">{caseData.visitCheckIn.replace('_', ' ')}</p>
                  </div>
                )}
                {(caseData.closureStatus || caseData.closureNotes || caseData.meetingSummary || caseData.actionRequired || caseData.responsibleAuthority) && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Closure</h3>
                    {caseData.closureStatus && <p className="text-sm text-surface-300">{caseData.closureStatus.replace(/_/g, ' ')}</p>}
                    {caseData.closureNotes && <p className="text-sm text-surface-200 mt-2 glass-light rounded-xl p-4">{caseData.closureNotes}</p>}
                    {caseData.meetingSummary && <p className="text-sm text-surface-200 mt-2"><span className="text-surface-500">Meeting summary:</span> {caseData.meetingSummary}</p>}
                    {caseData.actionRequired && <p className="text-sm text-surface-200 mt-1"><span className="text-surface-500">Action required:</span> {caseData.actionRequired}</p>}
                    {caseData.responsibleAuthority && <p className="text-sm text-surface-200 mt-1"><span className="text-surface-500">Responsible authority:</span> {caseData.responsibleAuthority.name} ({caseData.responsibleAuthority.designation})</p>}
                  </div>
                )}
                {caseData.meetingDate && !caseData.scheduledDate && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Preferred Date</h3>
                    <p className="text-sm text-surface-300">{format(new Date(caseData.meetingDate), 'PPpp')}</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Citizen Profile</h3>
                <div className="glass-light rounded-xl p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-surface-500 font-medium">Full Name</p>
                      <p className="text-sm text-white font-medium mt-1">{caseData.citizen.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 font-medium">Phone</p>
                      <p className="text-sm text-white font-medium mt-1">{caseData.citizen.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 font-medium">Address</p>
                    <p className="text-sm text-surface-300 mt-1">{caseData.citizen.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stakeholders */}
          {activeTab === 'stakeholders' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-semibold text-white mb-4">Mapped Stakeholders</h3>
                {caseData.stakeholders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {caseData.stakeholders.map((s: any) => (
                      <div key={s.officialId} className="glass-light rounded-xl p-4 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{s.official.name}</p>
                          <p className="text-xs text-primary-400 mt-1">{s.official.designation}</p>
                          <p className="text-xs text-surface-500">{s.official.department}</p>
                        </div>
                        {user?.role !== 'OFFICIAL' && (
                          <button
                            onClick={() => setStakeholderToRemove(s.officialId)}
                            className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-400/10 rounded ml-2 transition-colors"
                            title="Remove Stakeholder"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500">No stakeholders mapped yet.</p>
                )}
                {user?.role !== 'OFFICIAL' && (
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-white mb-3">Add Stakeholder</h4>
                    <div className="glass-light rounded-xl p-0 overflow-hidden">
                      <div className="p-4 border-b border-white/5">
                        <input 
                          type="text" 
                          placeholder="Search stakeholders by name, designation, or department..." 
                          className="input-dark w-full"
                          value={searchOfficial}
                          onChange={e => setSearchOfficial(e.target.value)}
                        />
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-sm text-surface-300">
                          <thead className="text-xs text-surface-400 uppercase bg-white/[0.02] sticky top-0 backdrop-blur-md">
                            <tr>
                              <th className="px-4 py-3 font-medium">Name & Details</th>
                              <th className="px-4 py-3 font-medium">Ministry/Dept</th>
                              <th className="px-4 py-3 font-medium">Contact & Address</th>
                              <th className="px-4 py-3 font-medium text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {officials
                              .filter(o => !caseData.stakeholders.find((s: any) => s.officialId === o.id))
                              .filter(o => !searchOfficial || [o.name, o.designation, o.department, o.psName].some(val => val?.toLowerCase().includes(searchOfficial.toLowerCase())))
                              .map((o: any) => (
                              <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 align-top">
                                  <p className="font-semibold text-white">{o.name}</p>
                                  <p className="text-xs text-primary-400 mt-0.5">{o.designation}</p>
                                  {o.psName && <p className="text-xs text-surface-500 mt-0.5">PS: {o.psName}</p>}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <p className="text-sm text-surface-200">{o.department}</p>
                                </td>
                                <td className="px-4 py-3 align-top">
                                  {o.contact && <p className="text-sm text-surface-200">{o.contact}</p>}
                                  {o.email && <p className="text-xs text-surface-400 mt-0.5">{o.email}</p>}
                                  {o.address && <p className="text-xs text-surface-500 mt-1 max-w-[200px] truncate" title={o.address}>{o.address}</p>}
                                </td>
                                <td className="px-4 py-3 align-top text-right">
                                  <button onClick={() => handleMapStakeholder(o.id)} className="btn-ghost text-xs py-1.5 px-3">
                                    Map
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Assignments */}
          {activeTab === 'assignments' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-semibold text-white mb-4">Create assignment</h3>
                <form onSubmit={handleCreateAssignment} className="glass-light rounded-xl p-5 space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Assign to *</label>
                      <select className="select-dark w-full" value={assignUserId} onChange={e => setAssignUserId(e.target.value)} required>
                        <option value="">Select user...</option>
                        {users.filter(u => u.role !== 'OFFICIAL').map((u: any) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Due date</label>
                      <input type="date" className="input-dark w-full" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Priority</label>
                      <select className="select-dark w-full" value={assignPriority} onChange={e => setAssignPriority(e.target.value)}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Status</label>
                      <select className="select-dark w-full" value={assignStatus} onChange={e => setAssignStatus(e.target.value)}>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="AWAITING_RESPONSE">Awaiting response</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Notes</label>
                    <textarea className="input-dark w-full" rows={2} value={assignNotes} onChange={e => setAssignNotes(e.target.value)} placeholder="Assignment notes..." />
                  </div>
                  <button type="submit" disabled={assignBusy || !assignUserId} className="btn-primary">Create assignment</button>
                </form>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mb-4">Assignments</h3>
                <div className="space-y-3">
                  {caseData.assignments?.map((a: any) => (
                    <div key={a.id} className="glass-light rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{a.user.name}</p>
                          {a.notes && <p className="text-xs text-surface-400 mt-1">{a.notes}</p>}
                          <p className="text-xs text-surface-500 mt-1">
                            {a.dueDate && format(new Date(a.dueDate), 'MMM d, yyyy')}
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-700 text-surface-300">{a.status?.replace(/_/g, ' ')}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingAssignmentId === a.id ? (
                            <>
                              <input type="date" className="input-dark text-sm w-36" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                              <select className="select-dark text-sm w-32" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                <option value="PENDING">Pending</option>
                                <option value="IN_PROGRESS">In progress</option>
                                <option value="AWAITING_RESPONSE">Awaiting response</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                              </select>
                              <button type="button" onClick={() => handleUpdateAssignment(a.id)} className="btn-primary text-xs">Save</button>
                              <button type="button" onClick={() => { setEditingAssignmentId(null); setEditDueDate(''); setEditStatus(''); setEditNotes(''); }} className="btn-ghost text-xs">Cancel</button>
                            </>
                          ) : (
                            <button type="button" onClick={() => { setEditingAssignmentId(a.id); setEditDueDate(a.dueDate ? format(new Date(a.dueDate), 'yyyy-MM-dd') : ''); setEditStatus(a.status || 'PENDING'); setEditNotes(a.notes || ''); }} className="btn-ghost text-xs">Edit</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!caseData.assignments || caseData.assignments.length === 0) && (
                    <p className="text-sm text-surface-500">No assignments yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comments */}
          {activeTab === 'comments' && (
            <div className="flex flex-col max-h-[600px]">
              <div className="flex-1 space-y-4 mb-6 overflow-y-auto">
                {caseData.comments.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto h-10 w-10 text-surface-600 mb-3" />
                    <p className="text-surface-500 text-sm">No comments yet</p>
                  </div>
                )}
                {caseData.comments.map((comment: any) => (
                  <div key={comment.id} className={`flex ${comment.userId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${comment.userId === user?.id ? 'glass-accent' : 'glass-light'}`}>
                      <div className="flex items-center justify-between mb-2 gap-4">
                        <span className="text-xs font-semibold text-primary-400">{comment.user.name}</span>
                        <span className="text-[10px] text-surface-600">{format(new Date(comment.createdAt), 'PP p')}</span>
                      </div>
                      {comment.imageUrl && (
                        <div className="mb-3">
                          <img src={`http://localhost:4000${comment.imageUrl}`} alt="Attachment" className="max-w-[16rem] rounded-lg object-cover border border-white/5 shadow-md" />
                        </div>
                      )}
                      <p className="text-sm text-surface-200 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-white/5">
                {commentImage && (
                  <div className="mb-3 relative inline-block">
                    <img src={URL.createObjectURL(commentImage)} alt="Preview" className="h-20 rounded-lg object-cover border border-white/10" />
                    <button type="button" onClick={() => setCommentImage(null)} className="absolute -top-2 -right-2 bg-surface-800 text-white rounded-full p-1 hover:bg-rose-500 hover:text-white transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleAddComment} className="flex gap-3 items-end">
                  <label className="btn-ghost p-3 cursor-pointer shrink-0 rounded-xl" title="Attach Image">
                    <ImageIcon className="h-5 w-5 text-surface-400 hover:text-primary-400 transition-colors" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setCommentImage(e.target.files[0]) }} />
                  </label>
                  <textarea
                    value={commentContent}
                    onChange={e => setCommentContent(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="input-dark flex-1 resize-none"
                  />
                  <button type="submit" disabled={!commentContent.trim() && !commentImage} className="btn-primary self-end px-5 mb-0.5" title="Send Comment">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Communications */}
          {activeTab === 'communications' && (
            <div className="space-y-6">
              <form onSubmit={handleAddCommunication} className="glass-light rounded-xl p-5 space-y-4 max-w-2xl">
                <h4 className="text-sm font-semibold text-white">Log communication</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Type</label>
                    <select className="select-dark w-full" value={commType} onChange={e => setCommType(e.target.value as any)}>
                      <option value="CALL">Call</option>
                      <option value="LETTER">Letter</option>
                      <option value="EMAIL">Email</option>
                      <option value="MEETING_NOTE">Meeting note</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Direction</label>
                    <select className="select-dark w-full" value={commDirection} onChange={e => setCommDirection(e.target.value as any)}>
                      <option value="INBOUND">Inbound</option>
                      <option value="OUTBOUND">Outbound</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Summary *</label>
                  <textarea className="input-dark w-full" rows={3} value={commSummary} onChange={e => setCommSummary(e.target.value)} placeholder="Summary of the communication..." required />
                </div>
                <button type="submit" disabled={commBusy || !commSummary.trim()} className="btn-primary">Add log</button>
              </form>
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Communication history</h4>
                {caseData.communicationLogs?.length > 0 ? (
                  <div className="space-y-2">
                    {caseData.communicationLogs.map((log: any) => (
                      <div key={log.id} className="glass-light rounded-xl p-4 flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-semibold text-primary-400">{log.type.replace(/_/g, ' ')}</span>
                          {log.direction && <span className="text-xs text-surface-500 ml-2">({log.direction})</span>}
                          <p className="text-sm text-surface-200 mt-1">{log.summary}</p>
                          <p className="text-[10px] text-surface-500 mt-1">{log.user?.name} · {format(new Date(log.createdAt), 'PP p')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500">No communication logs yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Files */}
          {activeTab === 'files' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-semibold text-white">Documents</h3>
                <label className="btn-ghost inline-flex items-center gap-2 cursor-pointer">
                  <Paperclip className="h-4 w-4" />
                  Upload
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              {caseData.files.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {caseData.files.map((f: any) => (
                    <div key={f.id} className="glass-light rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{f.filename}</p>
                        <p className="text-[10px] text-surface-500 mt-0.5">{format(new Date(f.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                      <a href={`${uploadsBase}${f.path}`} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs shrink-0">View / Download</a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 glass-light rounded-2xl">
                  <Paperclip className="mx-auto h-10 w-10 text-surface-600 mb-3" />
                  <p className="text-surface-400 text-sm font-medium">No documents uploaded</p>
                </div>
              )}
            </div>
          )}

          {/* Audit */}
          {activeTab === 'audit' && (
            <div>
              <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary-400" /> Audit Trail
              </h3>
              <div className="space-y-1">
                {caseData.auditLogs.map((log: any, idx: number) => (
                  <div key={log.id} className="relative pl-8 pb-6">
                    {idx !== caseData.auditLogs.length - 1 && (
                      <span className="absolute top-6 left-[11px] w-0.5 h-full bg-surface-800" />
                    )}
                    <span className="absolute left-0 top-1 w-6 h-6 rounded-full glass-light flex items-center justify-center">
                      <History className="h-3 w-3 text-surface-400" />
                    </span>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-surface-300">
                          <span className="font-semibold text-white">{log.user?.name || 'System'}</span>
                          {' '}<span className="px-2 py-0.5 rounded-md bg-surface-800/80 text-[10px] font-mono text-primary-400">{log.action}</span>
                        </p>
                      </div>
                      <span className="text-[10px] text-surface-600 whitespace-nowrap ml-4">{format(new Date(log.createdAt), 'PP pp')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {stakeholderToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setStakeholderToRemove(null)}></div>
          <div className="glass max-w-sm w-full rounded-2xl p-6 relative animate-fade-in shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Remove Stakeholder</h3>
            <p className="text-surface-300 text-sm mb-6">Are you sure you want to remove this stakeholder from the case? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setStakeholderToRemove(null)} 
                className="btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={handleRemoveStakeholder} 
                className="btn-danger shadow-lg shadow-red-500/20"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowResolveModal(false); setResolveNotes(''); }}></div>
          <div className="glass max-w-md w-full rounded-2xl p-6 relative animate-fade-in shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Resolve without meeting</h3>
            <p className="text-surface-300 text-sm mb-4">Close this case without scheduling a meeting. Resolution notes are required.</p>
            <textarea
              className="input-dark w-full mb-6"
              rows={4}
              value={resolveNotes}
              onChange={e => setResolveNotes(e.target.value)}
              placeholder="Enter resolution notes..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowResolveModal(false); setResolveNotes(''); }} className="btn-ghost">Cancel</button>
              <button onClick={() => handleAuthorize('RESOLVE_WITHOUT_MEETING')} disabled={workflowBusy || !resolveNotes.trim()} className="btn-primary">
                Resolve & close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
