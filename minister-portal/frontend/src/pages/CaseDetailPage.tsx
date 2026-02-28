import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { MessageSquare, Paperclip, Activity, FileText, UserPlus, Send, History, Play, CheckCircle, AlertTriangle, ImageIcon, X } from 'lucide-react';
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
  const [workflowBusy, setWorkflowBusy] = useState(false);

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
    if (!caseData?.citizen) return;
    try {
      const res = await api.get('/officials');
      setOfficials(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [caseData]);

  useEffect(() => { fetchCase(); }, [fetchCase]);
  useEffect(() => { if (activeTab === 'stakeholders') fetchOfficials(); }, [activeTab, fetchOfficials]);

  const handleAuthorize = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION') => {
    try {
      setWorkflowBusy(true);
      await api.patch(`/cases/${id}/authorize`, {
        action,
        rejectionReason: action === 'REJECT' ? rejectReason : undefined,
      });
      setRejectReason('');
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
      });
      setClosureNotes('');
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
    { id: 'comments', name: 'Comments', icon: MessageSquare, count: caseData.comments?.length },
    { id: 'files', name: 'Documents', icon: Paperclip, count: caseData.files?.length },
    { id: 'audit', name: 'Audit Trail', icon: History },
  ];

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
          {/* 6. Post-meeting closure: when scheduled (after check-in or without) or already marked arrived */}
          {(caseData.status === 'SCHEDULED' || caseData.visitCheckIn === 'ARRIVED') && (
            <form onSubmit={handleClose} className="flex flex-wrap items-center gap-2">
              <select className="select-dark text-sm w-44" value={closureStatus} onChange={e => setClosureStatus(e.target.value as any)}>
                <option value="COMPLETED">Completed</option>
                <option value="FOLLOW_UP_REQUIRED">Follow-up required</option>
                <option value="RESCHEDULE_REQUIRED">Reschedule required</option>
              </select>
              <input type="text" placeholder="Notes / action items" className="input-dark w-48 text-sm" value={closureNotes} onChange={e => setClosureNotes(e.target.value)} />
              <button type="submit" disabled={workflowBusy} className="btn-primary text-sm">Close</button>
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
                {(caseData.closureStatus || caseData.closureNotes) && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Closure</h3>
                    {caseData.closureStatus && <p className="text-sm text-surface-300">{caseData.closureStatus.replace(/_/g, ' ')}</p>}
                    {caseData.closureNotes && <p className="text-sm text-surface-200 mt-2 glass-light rounded-xl p-4">{caseData.closureNotes}</p>}
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

              <div className="pt-6 border-t border-white/5">
                <h3 className="text-base font-semibold text-white mb-4">Staff Assignments</h3>
                <div className="space-y-3">
                  {caseData.assignments?.map((a: any) => (
                    <div key={a.id} className="glass-light rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{a.user.name}</p>
                        {a.notes && <p className="text-xs text-surface-400 mt-1">{a.notes}</p>}
                      </div>
                      <span className="text-xs text-surface-500">{format(new Date(a.createdAt), 'MMM d')}</span>
                    </div>
                  ))}
                  {(!caseData.assignments || caseData.assignments.length === 0) && (
                    <p className="text-sm text-surface-500">Not assigned yet.</p>
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
    </div>
  );
};
