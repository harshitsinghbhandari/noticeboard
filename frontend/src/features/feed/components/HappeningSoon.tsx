export default function HappeningSoon() {
    const events = [
        {
            id: '1',
            title: 'Inter-Hostel Gaming Finals',
            location: 'Hostel 7 Grounds',
            time: 'Today 7:00 PM',
            tag: 'Starting Now',
            tagColor: 'bg-red-600',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCB_9oVyuzQXuTVaR20uQtxhQxe4QQn2ULGHhBeoRNj42ePmOLT-9_6ko0kgjcOVJzqoAwwWyFiHT3cWhXNaLv_y5VEYEVhe8sJio2YfkfzKRBEVqIulq9BXYpsZrdX7fImkcYeSLNQG6NozUGBOIyn6xku2DE03SxTQpMfegra_JULobaqyc1e9G3rSN4cJWXJAJwfnwiJ6WbJnKrGjOyCO-SIlTOl2Nbu12UuEB8AuOStmnZCzWmTE-teoTh4Eo8DxgMiwW36LA8',
            icon: 'sensors'
        },
        {
            id: '2',
            title: 'Midnight Hack-A-Thon',
            location: 'CS Lab 202',
            time: 'Today 8:00 PM',
            tag: 'In 45 mins',
            tagColor: 'bg-primary',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBD-dV2NWbNc2WL80PXJ1Dc5yEYcPzoLzGH7yxxVN1ob7w1Xf91JKDZfMZKWI-gToZU5uERK4V3aKgBUoES-6LvCDD17b3yHaRNe7SmQ-0TjUkhVmLjp8BQ1GBIeXZ0xUfWFuvpyN4qHX3j5Fi5jr1rBAjnuV0-JA4ypyHY3xmBRPeZhUdyZ2TD5GEpKyKP9-FV0gVhayQ0WhDXQyI6CqCGssXcwWs20mjHLhtirhAmqhSPWg-baoPFuOXIaDBHmA11t5bMTVtApkg',
            icon: 'schedule'
        },
        {
            id: '3',
            title: 'Open Mic Night',
            location: 'Main Auditorium',
            time: 'Today 9:30 PM',
            tag: 'In 2 hours',
            tagColor: 'bg-slate-900/80',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeDbworlv8en4HesSRxIxHbFEcHaPo5oTk7z4z25OpkvS6ESG8bWmlvHqQs55r294rJnBQsKWmoyt1cow3gqBmO9a8wd0iqv5jasNCvMbxwyt_bUZ0qhpaVV9jkPEBUKOF5vW5o3wr2wSof6vcH_WoMSwfpV0VZ-cmXnArjJfnR3AJXRL-Hrjd5h9w4cGCNzPI2YGOWAvPIrwLUMzk5OafPvbMRfNivVHeXFfrJMwS0prLeqTMjplEls_7gUpE2kBGpTY-GC0oKMU',
            icon: 'schedule'
        }
    ];

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Happening Soon
                </h2>
                <button className="text-xs font-semibold text-primary">View All</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {events.map(event => (
                    <div key={event.id} className="min-w-[280px] group relative rounded-xl overflow-hidden aspect-[16/9] bg-slate-800 cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                        <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={event.image} alt={event.title} />
                        <div className={`absolute top-3 left-3 z-20 px-2 py-1 ${event.tagColor} text-[10px] font-bold uppercase rounded text-white flex items-center gap-1 backdrop-blur-md`}>
                            <span className="material-symbols-outlined !text-[12px]">{event.icon}</span> {event.tag}
                        </div>
                        <div className="absolute bottom-3 left-3 z-20">
                            <p className="text-xs text-primary font-bold uppercase mb-0.5">{event.location}</p>
                            <h3 className="font-bold text-white text-base leading-tight">{event.title}</h3>
                            <p className="text-[11px] text-slate-300">{event.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
