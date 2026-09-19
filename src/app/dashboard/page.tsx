import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { LayoutDashboard, Download, CheckCircle, Clock, FileCode, Wrench, ShieldCheck, LogIn, Lock } from 'lucide-react';

async function getUserDashboardData(discordUserId: string | null) {
  if (!discordUserId) {
    // Return sample stats if not logged in
    const { data: decryptions } = await supabaseAdmin.from('decryptions').select('*').limit(10).order('created_at', { ascending: false });
    const { data: fixes } = await supabaseAdmin.from('fixes').select('*').limit(10).order('created_at', { ascending: false });
    const { data: plans } = await supabaseAdmin.from('plan_subscriptions').select('*').eq('active', 1).limit(1);

    return { decryptions: decryptions || [], fixes: fixes || [], plans: plans || [] };
  }

  try {
    const { data: decryptions } = await supabaseAdmin
      .from('decryptions')
      .select('*')
      .eq('user_id', discordUserId)
      .order('created_at', { ascending: false })
      .limit(15);

    const { data: fixes } = await supabaseAdmin
      .from('fixes')
      .select('*')
      .eq('user_id', discordUserId)
      .order('created_at', { ascending: false })
      .limit(15);

    const { data: plans } = await supabaseAdmin
      .from('plan_subscriptions')
      .select('*')
      .eq('user_id', discordUserId)
      .eq('active', 1)
      .order('expires_at', { ascending: false });

    return {
      decryptions: decryptions || [],
      fixes: fixes || [],
      plans: plans || [],
    };
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return { decryptions: [], fixes: [], plans: [] };
  }
}

export default async function DashboardPage() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  const discordUserId = user?.user_metadata?.provider_id || user?.user_metadata?.sub || null;
  const { decryptions, fixes, plans } = await getUserDashboardData(discordUserId);
  const activePlan = plans[0] || null;

  return (
    <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative">
      <Navbar />

      <div className="purple-glow-bg top-20 left-1/4 opacity-40"></div>

      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-8 py-10 w-full relative z-10">
        
        {/* DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-1">
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
              <span>MEMBER PORTAL</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              User <span className="purple-gradient-text">Dashboard</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full border border-purple-500/30 text-xs text-purple-200">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span>Logged in as {user.user_metadata?.full_name || user.email}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full border border-purple-500/30 text-xs text-purple-400/80">
                <Lock className="w-3.5 h-3.5" />
                <span>Guest Preview Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE SUBSCRIPTION PLAN BANNER */}
        <section className="mb-10">
          <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-purple-300">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-purple-300 uppercase tracking-widest">Active Plan</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      activePlan ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}>
                      {activePlan ? 'ACTIVE' : 'FREE MEMBER'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    {activePlan ? activePlan.plan_key.toUpperCase() : 'STANDARD FREE MEMBER'}
                  </h2>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Expires at: <span className="font-mono text-purple-200">{activePlan ? new Date(activePlan.expires_at).toLocaleString() : 'N/A'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link href="/" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2">
                  <span>Upgrade Plan</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SUMMARY STATS GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <DashboardStat label="Total Decryptions" value={decryptions.length} icon={FileCode} sub="Personal history" />
          <DashboardStat label="Total Fixes" value={fixes.length} icon={Wrench} sub="Geometry repairs" />
          <DashboardStat label="Daily Bonus Status" value="+1 Decrypt / +1 Fix" icon={Clock} sub="Active 48h credit" />
        </section>

        {/* RECENT DECRYPTION HISTORY TABLE */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-purple-100 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-purple-400" />
              <span>Decryption History</span>
            </h3>
            <span className="text-xs text-purple-400/70 font-mono">Showing recent entries</span>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950/40 text-purple-300 border-b border-purple-500/20 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-4">File Name</th>
                    <th className="p-4">Key Type</th>
                    <th className="p-4">Decrypted Files</th>
                    <th className="p-4">Elapsed</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {decryptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-purple-400/60">
                        No decryption history found for this account.
                      </td>
                    </tr>
                  ) : (
                    decryptions.map((item: any) => (
                      <tr key={item.id} className="hover:bg-purple-900/20 transition-colors">
                        <td className="p-4 font-semibold text-purple-100 flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{item.file_name}</span>
                        </td>
                        <td className="p-4 font-mono text-purple-300">{item.key_type || 'auto'}</td>
                        <td className="p-4 font-mono text-emerald-400 font-bold">{item.decrypted} files</td>
                        <td className="p-4 font-mono text-purple-300">{item.elapsed}s</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {item.download_url ? (
                            <a
                              href={item.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/40 hover:bg-purple-600 text-purple-200 font-medium text-xs border border-purple-400/30 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          ) : (
                            <span className="text-purple-400/40 italic">Expired</span>
                          )}
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

function DashboardStat({ label, value, icon: Icon, sub }: any) {
  return (
    <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-purple-500/20">
      <div>
        <span className="text-xs text-purple-300/70 font-medium block mb-1">{label}</span>
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="block text-[10px] text-purple-400/60 mt-1">{sub}</span>
      </div>
      <div className="p-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
