export default function SocialProof() {
    const socialEvents = [
        {
            id: '1',
            tag: 'Workshop',
            title: 'Design Thinking 101',
            count: 8,
            source: 'Hostel 7',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ8lKDMi8Cws2GLZICR2Cd4MoSPlBWfa9ir_pQqCBttf2t6tPqN32w9m3afTW9Gvi3earLDBCVoynocCmUsTTtvT611nyxllb8FgwXu9ojtKZydKHxwJrnZVrNZ_yuhlWQiI5F3iXkg66HCAwQA3cEOLRIir8jL8yG9O1bV2UwOUBEJftlzXo1WCxlZE4N-Ga3UIE5Xs1hcIgf3ahL8_3QiY0xwtNlSijALvRkyjxBvPxXiSnneaTAWCGgr3f2G3r2OkB0TreDcAA'
        },
        {
            id: '2',
            tag: 'Sports',
            title: 'B.Tech Basketball Trials',
            count: 15,
            source: 'B.Tech CS',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzMPxVTMCDRtsDKvy2DaH6_G4iRnUQW6bNsQYR8_ZGhJsuKoGa3VQxaoEd6jA0s5l36YINqC1fKlSemAZQaBWiMYLyb7QqrGBY_ZI73m8UA5x1x-vWz-NOcR5pvt-bJHKNhLsDcQv9p9WVCJ3w7qdlaOcxNAqlYHUvrXRbmClJKD6zEacU7i8cCYHibbSSnCwsJ4JtD_63QXOSoQUnaenJ2St_mwdO4oSbJJJ3rfddUCR3Pqn-tk0e_xO8MRM41lIhuxkfszFWdAQ'
        }
    ];

    return (
        <section className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Your People Are Going</h2>
                    <p className="text-xs text-slate-400">Events popular in B.Tech CS & Hostel 7</p>
                </div>
                <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-700"></div>
                    <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-600"></div>
                    <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-500"></div>
                    <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-primary flex items-center justify-center text-[10px] font-bold">+12</div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialEvents.map(event => (
                    <div key={event.id} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                            <img className="w-full h-full object-cover" src={event.image} alt={event.title} />
                        </div>
                        <div className="flex flex-col justify-between py-1">
                            <div>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">{event.tag}</span>
                                <h3 className="font-bold text-white mt-1">{event.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined !text-sm text-primary">groups</span>
                                <p className="text-xs font-medium text-slate-300">{event.count} from <span className="text-primary">{event.source}</span> going</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
