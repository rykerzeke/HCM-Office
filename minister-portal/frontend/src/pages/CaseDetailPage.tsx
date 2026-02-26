import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { MessageSquare, Paperclip, Activity, FileText, UserPlus, Send, History } from 'lucide-react';
import { format } from 'date-fns';

export const CaseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Comment state
  const [commentContent, setCommentContent] = useState('');
  // Mapping state
  const [officials, setOfficials] = useState<any[]>([]);
  const [selectedOfficial, setSelectedOfficial] = useState('');
  
  const fetchCase = async () => {
    try {
      const res = await api.get(`/cases/${id}`);
      setCaseData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficials = async () => {
    if (!caseData?.citizen) return;
    try {
      const res = await api.get(`/officials?stateId=${caseData.citizen.stateId}&districtId=${caseData.citizen.districtId}`);
      setOfficials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'stakeholders') fetchOfficials();
  }, [activeTab, caseData]);

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.patch(`/cases/${id}/status`, { status });
      fetchCase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    try {
      await api.post(`/cases/${id}/comments`, { content: commentContent });
      setCommentContent('');
      fetchCase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMapStakeholder = async () => {
    if (!selectedOfficial) return;
    try {
      await api.post(`/cases/${id}/stakeholders`, { officialId: selectedOfficial });
      setSelectedOfficial('');
      fetchCase();
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
      console.error(err);
      alert('File upload failed');
    }
  };

  if (loading) return <div>Loading details...</div>;
  if (!caseData) return <div>Case not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            {caseData.caseId}
            <span className="ml-4"><StatusBadge status={caseData.status} /></span>
            <span className="ml-2"><PriorityBadge priority={caseData.priority} /></span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Requested by {caseData.citizen?.name} on {format(new Date(caseData.createdAt), 'MMM d, yyyy')}</p>
        </div>
        
        {/* Status Actions */}
        <div className="mt-4 sm:mt-0 flex space-x-2">
          {caseData.status === 'PENDING' && (
            <button onClick={() => handleUpdateStatus('IN_PROGRESS')} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100">Start Progress</button>
          )}
          {caseData.status === 'IN_PROGRESS' && (
            <button onClick={() => handleUpdateStatus('COMPLETED')} className="px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100">Mark Completed</button>
          )}
          {(caseData.status === 'PENDING' || caseData.status === 'IN_PROGRESS') && (
            <button onClick={() => handleUpdateStatus('ESCALATED')} className="px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100">Escalate</button>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex px-4">
            {[
              { id: 'overview', name: 'Overview', icon: FileText },
              { id: 'stakeholders', name: 'Stakeholders & Assign', icon: UserPlus },
              { id: 'comments', name: 'Comments', icon: MessageSquare },
              { id: 'files', name: 'Documents', icon: Paperclip },
              { id: 'audit', name: 'Audit Trail', icon: History },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm
                    ${activeTab === tab.id 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  <Icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'}`} />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Request Purpose</h3>
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-100">{caseData.purpose}</p>
                </div>
                {caseData.meetingDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Requested Meeting Date</h3>
                    <p className="mt-1 text-sm text-gray-500">{format(new Date(caseData.meetingDate), 'PPpp')}</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Citizen Profile</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{caseData.citizen.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{caseData.citizen.phone}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{caseData.citizen.address || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Stakeholders & Assignment */}
          {activeTab === 'stakeholders' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mapped Stakeholders</h3>
                {caseData.stakeholders.length > 0 ? (
                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {caseData.stakeholders.map((s: any) => (
                      <li key={s.officialId} className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <p className="font-medium text-gray-900 text-sm">{s.official.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{s.official.designation}</p>
                        <p className="text-xs text-gray-500">{s.official.department}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No stakeholders mapped yet.</p>
                )}

                {user?.role !== 'OFFICIAL' && (
                  <div className="mt-6 flex items-end space-x-3 bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Add Stakeholder (Auto-suggested by District)</label>
                      <select 
                        className="block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                        value={selectedOfficial}
                        onChange={e => setSelectedOfficial(e.target.value)}
                      >
                        <option value="">Select Official...</option>
                        {officials.filter(o => !caseData.stakeholders.find((s:any) => s.officialId === o.id)).map(o => (
                          <option key={o.id} value={o.id}>{o.name} - {o.designation}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={handleMapStakeholder}
                      disabled={!selectedOfficial}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                      Map Official
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Office Assignments</h3>
                <p className="text-sm text-gray-500 mb-4">Internal staff assigned to track and resolve this request.</p>
                <ul className="space-y-3">
                  {caseData.assignments?.map((a: any) => (
                    <li key={a.id} className="flex items-start bg-gray-50 p-3 rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{a.user.name}</p>
                        {a.notes && <p className="text-sm text-gray-600 mt-1">{a.notes}</p>}
                      </div>
                      <span className="text-xs text-gray-500">{format(new Date(a.createdAt), 'MMM d')}</span>
                    </li>
                  ))}
                  {(!caseData.assignments || caseData.assignments.length === 0) && (
                    <li className="text-sm text-gray-500">Not assigned yet.</li>
                  )}
                </ul>
                <div className="mt-4">
                  {/* Simplistic assignment trigger simulation */}
                  <button className="text-sm text-primary-600 font-medium hover:underline">
                    + Assign Staff Member
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comments */}
          {activeTab === 'comments' && (
            <div className="flex flex-col h-full max-h-[600px]">
              <div className="flex-1 space-y-4 mb-6">
                {caseData.comments.map((comment: any) => (
                  <div key={comment.id} className={`flex ${comment.userId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-4 ${comment.userId === user?.id ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{comment.user.name}</span>
                        <span className="text-xs text-gray-500 ml-4">{format(new Date(comment.createdAt), 'PP p')}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {caseData.comments.length === 0 && (
                  <p className="text-center text-gray-500 text-sm mt-8">No comments yet. Start the conversation.</p>
                )}
              </div>
              <form onSubmit={handleAddComment} className="flex space-x-3 mt-auto pt-4 border-t border-gray-200">
                <textarea
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  placeholder="Add a comment or update..."
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
                />
                <button
                  type="submit"
                  disabled={!commentContent.trim()}
                  className="inline-flex items-center self-end px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 h-10"
                >
                  <Send className="h-4 w-4 mr-2" /> Post
                </button>
              </form>
            </div>
          )}

          {/* Files */}
          {activeTab === 'files' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Supporting Documents & Evidence</h3>
                <div>
                  <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
                    Upload Files
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
              
              {caseData.files.length > 0 ? (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {caseData.files.map((f: any) => (
                    <li key={f.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center overflow-hidden">
                        <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
                        <div className="ml-3 truncate">
                          <p className="text-sm font-medium text-gray-900 truncate" title={f.filename}>{f.filename}</p>
                          <p className="text-xs text-gray-500">{format(new Date(f.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <a href={f.path} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-900 ml-4 flex-shrink-0">
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Paperclip className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No documents uploaded yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Audit Trail */}
          {activeTab === 'audit' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-gray-400" />
                Immutable Audit Log
              </h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {caseData.auditLogs.map((log: any, idx: number) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {idx !== caseData.auditLogs.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                              <History className="h-4 w-4 text-gray-500" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-900">{log.user?.name || 'System'}</span> 
                                {' '}performed <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-800">{log.action}</span>
                              </p>
                              <div className="mt-1 text-xs text-gray-500">
                                <pre className="font-mono bg-gray-50 p-2 rounded border border-gray-100 mt-1 max-w-full overflow-x-auto">
                                  {JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}
                                </pre>
                              </div>
                            </div>
                            <div className="text-right text-xs whitespace-nowrap text-gray-500">
                              <time dateTime={log.createdAt}>{format(new Date(log.createdAt), 'PP pp')}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
