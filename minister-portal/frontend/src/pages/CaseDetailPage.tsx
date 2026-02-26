import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { MessageSquare, Paperclip, Activity, FileText, UserPlus, Send, History, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const CaseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [commentContent, setCommentContent] = useState('');
  const [officials, setOfficials] = useState<any[]>([]);
  const [selectedOfficial, setSelectedOfficial] = useState('');

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
      const res = await api.get(`/officials?stateId=${caseData.citizen.stateId}&districtId=${caseData.citizen.districtId}`);
      setOfficials(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [caseData]);

  useEffect(() => { fetchCase(); }, [fetchCase]);
  useEffect(() => { if (activeTab === 'stakeholders') fetchOfficials(); }, [activeTab, fetchOfficials]);

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.patch(`/cases/${id}/status`, { status });
      fetchCase();
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    try {
      await api.post(`/cases/${id}/comments`, { content: commentContent });
      setCommentContent('');
      fetchCase();
    } catch (err) { console.error(err); }
  };

  const handleMapStakeholder = async () => {
    if (!selectedOfficial) return;
    try {
      await api.post(`/cases/${id}/stakeholders`, { officialId: selectedOfficial });
      setSelectedOfficial('');
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

        <div className="flex gap-2">
          {caseData.status === 'PENDING' && (
            <button onClick={() => handleUpdateStatus('IN_PROGRESS')} className="btn-ghost inline-flex items-center gap-2 text-blue-400 border-blue-500/20 hover:bg-blue-500/10">
              <Play className="h-4 w-4" /> Start
            </button>
          )}
          {caseData.status === 'IN_PROGRESS' && (
            <button onClick={() => handleUpdateStatus('COMPLETED')} className="btn-ghost inline-flex items-center gap-2 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
              <CheckCircle className="h-4 w-4" /> Complete
            </button>
          )}
          {(caseData.status === 'PENDING' || caseData.status === 'IN_PROGRESS') && (
            <button onClick={() => handleUpdateStatus('ESCALATED')} className="btn-ghost inline-flex items-center gap-2 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">
              <AlertTriangle className="h-4 w-4" /> Escalate
            </button>
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
                {caseData.meetingDate && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Meeting Date</h3>
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
                      <div key={s.officialId} className="glass-light rounded-xl p-4">
                        <p className="text-sm font-semibold text-white">{s.official.name}</p>
                        <p className="text-xs text-primary-400 mt-1">{s.official.designation}</p>
                        <p className="text-xs text-surface-500">{s.official.department}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500">No stakeholders mapped yet.</p>
                )}
                {user?.role !== 'OFFICIAL' && (
                  <div className="mt-6 glass-light rounded-xl p-5 flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Add Stakeholder</label>
                      <select
                        className="select-dark w-full"
                        value={selectedOfficial}
                        onChange={e => setSelectedOfficial(e.target.value)}
                      >
                        <option value="">Select Official...</option>
                        {officials.filter(o => !caseData.stakeholders.find((s: any) => s.officialId === o.id)).map((o: any) => (
                          <option key={o.id} value={o.id}>{o.name} — {o.designation}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={handleMapStakeholder} disabled={!selectedOfficial} className="btn-primary">
                      Map
                    </button>
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
                      <p className="text-sm text-surface-200 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-3 pt-4 border-t border-white/5">
                <textarea
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="input-dark flex-1 resize-none"
                />
                <button type="submit" disabled={!commentContent.trim()} className="btn-primary self-end px-5">
                  <Send className="h-4 w-4" />
                </button>
              </form>
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
    </div>
  );
};
