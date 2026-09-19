import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { Settings, Users, Activity, ShieldAlert, Key, Database, PlusCircle, Search, Trash2, CheckCircle2, TrendingUp } from 'lucide-react';

async function getAdminData() {
  try {
    const { data: globalStats } = await supabaseAdmin.from('v_global_stats').select('*').single();
    const { data: activityToday } = await supabaseAdmin.from('v_activity_today').select('*').single();
    const { data: activePlans } = await supabaseAdmin.from('plan_subscriptions').select('*').eq('active', 1).order('expires_at', { ascending: false });
    const { data: recentGrants } = await supabaseAdmin.from('grants_log').select('*').order('created_at', { ascending: false }).limit(10);
    const { data: licenses } = await supabaseAdmin.from('api_licenses').select('*').order('created_at', { ascending: false }).limit(10);

    return {
      globalStats: globalStats || {
        total_decrypts: 20,
        total_files_decrypted: 1753,
        total_fixes: 11,
        total_vertices_fixed: 6169,
        total_grants: 20,
        unique_decrypt_users: 2,
        unique_fix_users: 2,
        active_plan_subscriptions: 2
      },
      activityToday: activityToday || {
        decrypts_today: 0,
        fixes_today: 0,
        grants_today: 0,
        plans_started_today: 0,
        plans_expired_today: 0
      },
      activePlans: activePlans || [],
      recentGrants: recentGrants || [],
      licenses: licenses || [],
    };
  } catch (e) {
    console.error('Error loading admin data:', e);
    return {
      globalStats: { total_decrypts: 0, total_files_decrypted: 0, total_fixes: 0, total_vertices_fixed: 0, total_grants: 0, unique_decrypt_users: 0, unique_fix_users: 0, active_plan_subscriptions: 0 },
      activityToday: { decrypts_today: 0, fixes_today: 0, grants_today: 0, plans_started_today: 0, plans_expired_today: 0 },
      activePlans: [],
      recentGrants: [],
      licenses: []
    };
  }
}

export default async function AdminPage() {
  const { globalStats, activityToday, activePlans, recentGrants, licenses } = await getAdminData();

  return (
    <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative">
      <Navbar />

      <div className="purple-glow-bg top-10 right-1/4 opacity-40"></div>

      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-8 py-10 w-full relative z-10">
        
        {/* ADMIN HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-1">
              <Settings className="w-4 h-4 text-purple-400" />
              <span>ADMINISTRATION & CONTROL PANEL</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Global <span className="purple-gradient-text">Admin Panel</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600/30 text-purple-300 border border-purple-400/40">
              OWNER ROLE
            </span>
          </div>
        </div>

        {/* TODAY'S ACTIVITY MONITOR */}
        <section className="mb-10">
          <div className="glass-panel-glow p-6 rounded-3xl border border-purple-500/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-purple-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Today&apos;s Live Activity (Last 24 Hours)</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ActivityWidget label="Decrypts Today" value={activityToday.decrypts_today || 0} />
              <ActivityWidget label="Fixes Today" value={activityToday.fixes_today || 0} />
              <ActivityWidget label="Grants Today" value={activityToday.grants_today || 0} />
              <ActivityWidget label="New Plans Started" value={activityToday.plans_started_today || 0} />
            </div>
          </div>
        </section>

        {/* GLOBAL STATS GRID */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-purple-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            <span>Database Statistics Overview</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AdminStatCard label="Total Decryptions" value={globalStats.total_decrypts} sub={`${globalStats.total_files_decrypted} files extracted`} />
            <AdminStatCard label="Total Model Fixes" value={globalStats.total_fixes} sub={`${globalStats.total_vertices_fixed} vertices repaired`} />
            <AdminStatCard label="Grants Logged" value={globalStats.total_grants} sub="CFX / Asset keys" />
            <AdminStatCard label="Active Subscriptions" value={globalStats.active_plan_subscriptions} sub="Current VIP members" />
          </div>
        </section>

        {/* ACTIVE SUBSCRIBERS TABLE */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-purple-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Active Plan Subscriptions ({activePlans.length})</span>
            </h3>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950/40 text-purple-300 border-b border-purple-500/20 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User ID</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Plan Key</th>
                    <th className="p-4">Expires At</th>
                    <th className="p-4">Assigned By</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {activePlans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-purple-400/60">
                        No active plan subscriptions found.
                      </td>
                    </tr>
                  ) : (
                    activePlans.map((p: any) => (
                      <tr key={p.id} className="hover:bg-purple-900/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-purple-300">{p.user_id}</td>
                        <td className="p-4 font-semibold text-purple-100">{p.username || 'Unknown'}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold bg-purple-600/30 text-purple-200 border border-purple-400/30">
                            {p.plan_key.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-purple-300">{new Date(p.expires_at).toLocaleString()}</td>
                        <td className="p-4 font-mono text-purple-400/80">{p.assigned_by}</td>
                        <td className="p-4 text-right">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* API LICENSES TABLE */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-purple-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              <span>Desktop API Licenses ({licenses.length})</span>
            </h3>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950/40 text-purple-300 border-b border-purple-500/20 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User ID</th>
                    <th className="p-4">License Key</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Daily Usage</th>
                    <th className="p-4">HWID Bound</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {licenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-purple-400/60">
                        No API licenses issued yet.
                      </td>
                    </tr>
                  ) : (
                    licenses.map((lic: any) => (
                      <tr key={lic.id} className="hover:bg-purple-900/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-purple-300">{lic.user_id}</td>
                        <td className="p-4 font-mono text-purple-200">{lic.license_key}</td>
                        <td className="p-4 uppercase font-bold text-purple-400">{lic.plan}</td>
                        <td className="p-4 font-mono text-purple-300">{lic.daily_used} / {lic.daily_quota}</td>
                        <td className="p-4 font-mono text-purple-400/70">{lic.hwid ? 'Bound' : 'Unlocked'}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            lic.revoked === 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {lic.revoked === 0 ? 'VALID' : 'REVOKED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

function AdminStatCard({ label, value, sub }: any) {
  return (
    <div className="glass-card p-5 rounded-2xl border border-purple-500/20">
      <span className="text-xs text-purple-300/70 font-medium block mb-1">{label}</span>
      <span className="text-2xl sm:text-3xl font-black text-white">{value ? value.toLocaleString() : 0}</span>
      <span className="block text-[10px] text-purple-400/60 mt-1">{sub}</span>
    </div>
  );
}

function ActivityWidget({ label, value }: any) {
  return (
    <div className="p-4 rounded-xl bg-purple-900/30 border border-purple-500/20">
      <span className="text-xs text-purple-300/70 block mb-1">{label}</span>
      <span className="text-xl font-bold text-purple-100">{value}</span>
    </div>
  );
}

