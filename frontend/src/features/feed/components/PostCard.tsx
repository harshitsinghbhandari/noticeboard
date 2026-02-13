import { Link } from 'react-router-dom';
import type { FeedItem, Post } from '../../../types';

interface PostCardProps {
    post: FeedItem | Post;
    onLike: (post: FeedItem | Post) => void;
    onCommentAdded: (postId: string) => void;
}

export default function PostCard({ post, onLike }: PostCardProps) {
    const isOpening = post.type === 'opening';

    // Mock images if none provided in post data
    const imageUrl = isOpening
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXBZIxm9BikQYQCV0BzJUepgW5b_4diHE86e644UX-goe_tmbdjfiLqHPeSzHX0B0sTIK8fU5hrundhNhua_XG7AKtv9_cgMSpFoSA92N5elgA82UGTUL9T5NVzF1XB_ikRW0EuDcn328cdp5YMNUS88rvUiNa1qAHdbHQzFcSd26KrFNg8iTh4jVVV95gK15FyOIYSXNOIozAxL94I0IJpD9hmIYsLtwNWrsAKAA5FeVzrTYufqAf_a0ROLXzpoyDRHBTISkmFTk'
        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs2W7_qcWK4Uu0izaQ0ZcjFQBrljxuzj72hzr9wdsdo952hGs45ka-6_AAph-epLUlsGrjaxTrn5pSJ935_4vWsXVmZMy-tdSgFjpGQGLBlA8EpGriYnE9n8SQezC0n0HkzcIieMaIn6LrVkKSnDvw8vMoQyV_A52GIY20vnlfySu81q1EJf9caKwc-Pyif4cP8atugsQAaV_G-d0JqjHROtGs7hQMot-SfrquL2g1DhskukPZxZDsGdIlEq6ne0ZOc5c9qun69NI';

    return (
        <div className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all">
            <div className="relative aspect-[21/9] md:aspect-[3/1] bg-slate-800">
                <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={imageUrl}
                    alt={post.content.substring(0, 20)}
                />
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                    {isOpening ? 'Opening' : 'Campus Event'}
                </div>
            </div>
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined !text-sm">calendar_today</span>
                            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined !text-sm">location_on</span>
                            {isOpening ? `${(post as any).location_city}, ${(post as any).location_country}` : 'Campus Grounds'}
                        </span>
                    </div>
                    <Link to={`/posts/${post.id}`} className="block">
                        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                            {isOpening ? (post as any).title : (post.content.split('\n')[0].substring(0, 50) || 'Untitled Pulse')}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-600 border border-background-dark"></div>
                            <div className="w-6 h-6 rounded-full bg-slate-500 border border-background-dark"></div>
                            <div className="w-6 h-6 rounded-full bg-slate-400 border border-background-dark"></div>
                        </div>
                        <p className="text-sm font-medium text-slate-300">
                            <span className="text-primary font-bold">
                                {isOpening ? 'Many' : (Number(post.likes_count) || 0)}
                            </span> {isOpening ? 'applying' : 'interested'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => isOpening ? null : onLike(post)}
                        className={`px-6 py-3 ${post.has_liked ? 'bg-white/10 text-primary border border-primary/30' : 'bg-primary text-white shadow-primary/20 shadow-lg'} hover:opacity-90 font-bold rounded-xl transition-all active:scale-95 whitespace-nowrap`}
                    >
                        {isOpening ? 'Apply Now' : (post.has_liked ? 'Interested' : 'RSVP Now')}
                    </button>
                    <button className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all">
                        <span className="material-symbols-outlined">share</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
