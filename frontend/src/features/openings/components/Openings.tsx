import { useOpenings } from '../hooks/useOpenings';

export default function Openings() {
  const { openings, loading, filters, setFilters } = useOpenings();

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Campus Opportunities</h1>
        <p className="text-slate-400">Apply for positions in campus bodies and organizations.</p>
      </header>

      <div className="flex flex-wrap gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
        <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">work</span>
            <select
                className="w-full bg-white/5 border-none rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                value={filters.job_type}
                onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
            >
                <option value="" className="bg-background-dark text-white">All Job Types</option>
                <option value="full-time" className="bg-background-dark text-white">Full-time</option>
                <option value="part-time" className="bg-background-dark text-white">Part-time</option>
                <option value="internship" className="bg-background-dark text-white">Internship</option>
                <option value="contract" className="bg-background-dark text-white">Contract</option>
            </select>
        </div>

        <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">school</span>
            <select
                className="w-full bg-white/5 border-none rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                value={filters.experience_level}
                onChange={(e) => setFilters({ ...filters, experience_level: e.target.value })}
            >
                <option value="" className="bg-background-dark text-white">All Levels</option>
                <option value="entry" className="bg-background-dark text-white">Entry Level</option>
                <option value="mid" className="bg-background-dark text-white">Mid Level</option>
                <option value="senior" className="bg-background-dark text-white">Senior Level</option>
                <option value="executive" className="bg-background-dark text-white">Executive</option>
            </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-white">Scanning for opportunities...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {openings.map(opening => (
            <div key={opening.id} className="group bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all p-6 flex flex-col md:flex-row gap-6">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                {opening.body_name?.[0] || 'O'}
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{opening.title}</h2>
                    <p className="text-primary font-semibold text-sm">{opening.body_name || 'Campus Organization'}</p>
                  </div>
                  <button className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 text-sm">
                    Apply Pulse
                  </button>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{opening.description}</p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined !text-sm">location_on</span> {opening.location_city}
                  </span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined !text-sm">work</span> {opening.job_type}
                  </span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined !text-sm">grade</span> {opening.experience_level}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {openings.length === 0 && (
            <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl">
              <p className="text-slate-500">No openings matching your current pulse.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
