import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Activity, Clock, Users, CheckCircle, TrendingUp, ArrowUpRight, Calendar, AlertCircle, Zap } from 'lucide-react';
import { format } from 'date-fns';

export const DashboardPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Requests',
      value: stats?.stats?.totalRequests || 0,
      icon: Activity,
      gradient: 'from-primary-500/20 to-primary-700/10',
      iconColor: 'text-primary-400',
      borderColor: 'border-primary-500/15',
    },
    {
      label: 'Pending Approval',
      value: (stats?.stats?.pendingApproval ?? 0) + (stats?.stats?.onHold ?? 0),
      icon: Clock,
      gradient: 'from-amber-500/20 to-amber-700/10',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/15',
    },
    {
      label: 'Completed',
      value: stats?.stats?.completedTasks || 0,
      icon: CheckCircle,
      gradient: 'from-emerald-500/20 to-emerald-700/10',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/15',
    },
    {
      label: 'Follow-up Required',
      value: stats?.stats?.followUpRequired || 0,
      icon: AlertCircle,
      gradient: 'from-orange-500/20 to-orange-700/10',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-500/15',
    },
    {
      label: 'High Priority',
      value: stats?.stats?.highPriority || 0,
      icon: Zap,
      gradient: 'from-rose-500/20 to-rose-700/10',
      iconColor: 'text-rose-400',
      borderColor: 'border-rose-500/15',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-surface-400 mt-1">Overview of all citizen requests</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const linkHref = card.label === 'Follow-up Required' && card.value > 0 ? '/cases?status=FOLLOW_UP_REQUIRED' : undefined;
          const Wrapper = linkHref ? Link : 'div';
          const wrapperProps = linkHref ? { to: linkHref, className: 'block' } : {};
          return (
            <Wrapper key={i} {...wrapperProps}>
              <div
                className={`glass rounded-2xl p-6 ${card.borderColor} hover:scale-[1.02] transition-transform duration-200 ${linkHref ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient}`}>
                    <Icon className={`h-5 w-5 icon-3d ${card.iconColor}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-surface-600" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">{card.value}</p>
                  <p className="text-sm text-surface-400 mt-1 font-medium">{card.label}</p>
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>

      {/* Upcoming Meetings */}
      {stats?.upcomingMeetings?.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-400 icon-3d" />
            <h3 className="text-base font-semibold text-white">Upcoming Meetings</h3>
          </div>
          <div className="divide-y divide-white/5">
            {stats.upcomingMeetings.map((c: any) => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-white">{c.caseId}</p>
                  <p className="text-xs text-surface-400">{c.citizen?.name} · {c.citizen?.phone}</p>
                </div>
                <span className="text-xs text-primary-400 font-medium">
                  {c.scheduledDate && format(new Date(c.scheduledDate), 'MMM d, yyyy')}
                  {c.scheduledTimeSlot && ` · ${c.scheduledTimeSlot}`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-400 icon-3d" />
            <h3 className="text-base font-semibold text-white">Recent Activity</h3>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {stats?.recentUpdates?.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Activity className="mx-auto h-10 w-10 text-surface-600 mb-3" />
              <p className="text-surface-500 text-sm font-medium">No recent activity found</p>
              <p className="text-surface-600 text-xs mt-1">Activity will appear here as cases are created</p>
            </div>
          )}
          {stats?.recentUpdates?.map((log: any) => (
            <div key={log.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-surface-200">
                      <span className="font-semibold text-white">{log.user?.name || 'System'}</span>
                      <span className="mx-1.5 text-surface-600">·</span>
                      <span className="px-2 py-0.5 rounded-md bg-surface-800/50 text-xs font-mono text-surface-400">{log.action}</span>
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Case: <span className="text-primary-400">{log.case?.caseId || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-surface-600 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
