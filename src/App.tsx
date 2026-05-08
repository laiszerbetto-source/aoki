import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  CheckCircle2, XCircle, Clock, Send, Instagram, Facebook, Linkedin, 
  Plus, Trash2, Smartphone, Eye, Copy, Image as ImageIcon, Film, 
  Hash, Check, Layers, Square, ThumbsUp, MessageSquare, Share2, Edit3, Globe, Calendar, AlertCircle, Briefcase, Loader2, Share, ChevronLeft, ChevronRight, LayoutGrid
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyARH2lOjbz9fQsOVJ25y-IQdzuMnfbfpRE",
  authDomain: "aoki-7a6ec.firebaseapp.com",
  projectId: "aoki-7a6ec",
  storageBucket: "aoki-7a6ec.firebasestorage.app",
  messagingSenderId: "762583424160",
  appId: "1:762583424160:web:72fa8b3bf5597a1db13dc5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const INITIAL_CLIENTS = [
  { id: 'geral', name: 'Visão Geral (Agência)', handle: 'aokimidias', color: 'from-indigo-600 to-purple-700' },
  { id: 'c1', name: 'Grupo Aoki', handle: 'grupoaoki', color: 'from-slate-700 to-black' },
  { id: 'c2', name: 'Ford Aoki', handle: 'fordaoki', color: 'from-blue-600 to-blue-900' },
  { id: 'c3', name: 'Mercedes Aoki', handle: 'mercedesaoki', color: 'from-slate-300 to-slate-500' },
  { id: 'c4', name: 'Consórcios Aoki', handle: 'consorciosaoki', color: 'from-emerald-500 to-teal-700' },
  { id: 'c5', name: 'NAKI Autopeças', handle: 'nakiautopecas', color: 'from-red-600 to-red-800' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [activeClientId, setActiveClientId] = useState(INITIAL_CLIENTS[0].id);
  const [activeTab, setActiveTab] = useState('todos');
  const [mainView, setMainView] = useState('feed');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [copiedType, setCopiedType] = useState(null);
  const [isClientView, setIsClientView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formState, setFormState] = useState({
    content: '', platforms: [], hashtags: '', postType: 'estatico',
    media: null, scheduleDate: '', scheduleTime: ''
  });
  
  const [previewPost, setPreviewPost] = useState(null);
  const [previewPlatform, setPreviewPlatform] = useState('instagram');

  const fileInputRef = useRef(null);
  const currentClient = INITIAL_CLIENTS.find(c => c.id === activeClientId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') setIsClientView(true);
  }, []);

  useEffect(() => {
    if (currentClient) {
      document.title = isClientView 
        ? `Aprovação: ${currentClient.name} | Aoki` 
        : `${currentClient.name} | SocialFlow Aoki`;
    }
  }, [currentClient, isClientView]);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro auth:", err));
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const postsRef = collection(db, 'agencias', 'aoki', 'posts');
    const unsubscribe = onSnapshot(postsRef, (snapshot) => {
      const docs = [];
      snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosts(docs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const clientPosts = activeClientId === 'geral' ? posts : posts.filter(p => p.clientId === activeClientId);
    if (!previewPost || (activeClientId !== 'geral' && previewPost.clientId !== activeClientId)) {
      setPreviewPost(clientPosts[0] || null);
      if (clientPosts[0]) setPreviewPlatform(clientPosts[0].platforms[0]);
    }
  }, [activeClientId, posts]);

  const filteredPosts = posts.filter(p => {
    const clientMatch = activeClientId === 'geral' ? true : p.clientId === activeClientId;
    const statusMatch = activeTab === 'todos' || p.status === activeTab;
    return clientMatch && statusMatch;
  });

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploadError('');
    if (files.length === 0) return;
    if (files.some(f => f.size > 5000000)) {
      setUploadError('Ficheiros demasiado grandes (Máx 5MB).');
      return;
    }
    const readMedia = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({
        type: file.type.startsWith('video') ? 'video' : 'image',
        url: reader.result
      });
      reader.readAsDataURL(file);
    });
    const newMedia = await Promise.all(files.map(readMedia));
    setFormState(prev => ({
      ...prev,
      media: prev.postType === 'carrossel' 
        ? [...(Array.isArray(prev.media) ? prev.media : (prev.media ? [prev.media] : [])), ...newMedia] 
        : newMedia[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.content.trim() || formState.platforms.length === 0) return;
    try {
      const id = editingId || Date.now().toString();
      await setDoc(doc(db, 'agencias', 'aoki', 'posts', id), {
        ...formState,
        clientId: activeClientId === 'geral' ? 'c1' : activeClientId,
        status: editingId ? (posts.find(p => p.id === editingId)?.status || 'pendente') : 'pendente',
        date: editingId ? posts.find(p => p.id === editingId).date : new Date().toISOString(),
        feedback: ''
      }, { merge: true });
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      setUploadError("Erro ao guardar.");
    }
  };

  const removeMedia = (index) => {
    setFormState(prev => {
      const newMedia = Array.isArray(prev.media) ? [...prev.media] : [prev.media];
      newMedia.splice(index, 1);
      return { ...prev, media: newMedia.length > 0 ? (prev.postType === 'carrossel' ? newMedia : newMedia[0]) : null };
    });
  };

  const moveMedia = (index, direction) => {
    setFormState(prev => {
      if (!Array.isArray(prev.media)) return prev;
      const newMedia = [...prev.media];
      if (index + direction < 0 || index + direction >= newMedia.length) return prev;
      const temp = newMedia[index];
      newMedia[index] = newMedia[index + direction];
      newMedia[index + direction] = temp;
      return { ...prev, media: newMedia };
    });
  };

  const deletePost = async (id) => {
    if (confirm("Apagar rascunho?")) await deleteDoc(doc(db, 'agencias', 'aoki', 'posts', id));
  };

  const copyClientLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'client');
    const textArea = document.createElement("textarea");
    textArea.value = url.toString();
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert("Link copiado!");
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { firstDay, days };
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(newDate);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse text-xl">Sincronizando Aoki Flow...</div>;

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row bg-[#F8FAFC] font-sans text-slate-900 antialiased overflow-hidden">
      <aside className="w-full md:w-72 bg-white border-b md:border-r border-slate-200 p-5 md:p-6 flex flex-col gap-8 max-h-[45vh] md:max-h-none md:h-full overflow-y-auto overflow-x-hidden z-20 shrink-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">  
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-2xl text-white shadow-lg shadow-indigo-100"><Send size={24} /></div>
          <span className="font-black text-2xl tracking-tighter">SocialFlow</span>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={12} /> Marca Aoki</p>
            <select className="w-full bg-white border border-slate-200 text-sm font-bold rounded-xl px-4 py-3 outline-none cursor-pointer" value={activeClientId} onChange={(e) => setActiveClientId(e.target.value)}>
              {INITIAL_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <nav className="space-y-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-4">Visualização</p>
             <button onClick={() => setMainView('feed')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm transition-all ${mainView === 'feed' ? 'bg-slate-900 text-white font-bold shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid size={18} /> Feed</button>
             <button onClick={() => setMainView('calendario')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm transition-all ${mainView === 'calendario' ? 'bg-slate-900 text-white font-bold shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><Calendar size={18} /> Calendário</button>
          </nav>
          <nav className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-4">Status</p>
            {[{ id: 'todos', label: 'Todos', icon: <Eye size={18} /> }, { id: 'pendente', label: 'Pendentes', icon: <Clock size={18} className="text-amber-500" /> }, { id: 'aprovado', label: 'Aprovados', icon: <CheckCircle2 size={18} className="text-emerald-500" /> }, { id: 'rejeitado', label: 'Rejeitados', icon: <XCircle size={18} className="text-rose-500" /> }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm transition-all ${activeTab === t.id ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>{t.icon} {t.label}</button>
            ))}
          </nav>
        </div>

        {!isClientView && (
          <div className="mt-auto space-y-3">
             <button onClick={copyClientLink} className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-xs border border-slate-200"><Share size={16} /> Link p/ Cliente</button>
             <button onClick={() => { setEditingId(null); setFormState({ content: '', platforms: [], hashtags: '', postType: 'estatico', media: null, scheduleDate: '', scheduleTime: '' }); setIsModalOpen(true); }} className="w-full bg-indigo-600 text-white py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl"><Plus size={20} /> Novo Post</button>
          </div>
        )}
      </aside>

      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-5 md:p-10 min-w-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-4 h-4 rounded-lg bg-gradient-to-tr ${currentClient?.color} shadow-sm`} />
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentClient?.name}</h2>
            </div>
            <p className="text-slate-400 text-sm font-medium italic">Dashboard Aoki</p>
          </div>
        </header>

        {mainView === 'feed' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start content-start">
              {filteredPosts.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center flex flex-col items-center lg:col-span-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest"><ImageIcon className="w-12 h-12 mb-4 text-slate-200" /> Sem rascunhos</div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post.id} onClick={() => { setPreviewPost(post); setPreviewPlatform(post.platforms[0]); }} className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer hover:shadow-2xl relative ${previewPost?.id === post.id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-2">
                        {post.platforms.map(plt => (
                          <div key={plt} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-indigo-600">
                            {plt === 'instagram' && <Instagram size={18} />}
                            {plt === 'facebook' && <Facebook size={18} />}
                            {plt === 'linkedin' && <Linkedin size={18} />}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-lg border border-slate-200">{post.postType}</span>
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${post.status === 'aprovado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{post.status}</div>
                      </div>
                    </div>

                    <div className="flex gap-6 items-start">
                      {/* MINIATURA DO FEED EM 4:5 (1080x1350) */}
                      <div className="w-28 aspect-[4/5] shrink-0 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative shadow-inner">
                        {(() => {
                          const mediaArr = Array.isArray(post.media) ? post.media : (post.media ? [post.media] : []);
                          if (mediaArr.length === 0) return <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-slate-200" /></div>;
                          return (
                            <div className="flex overflow-x-auto snap-x snap-mandatory w-full h-full scrollbar-hide items-center">
                              {mediaArr.map((m, i) => (
                                <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center relative">
                                  {m.type === 'video' ? <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center"><Film size={20} /></div> : <img src={m.url} className="w-full h-full object-contain p-1" />}
                                  {mediaArr.length > 1 && <span className="absolute top-1 right-1 bg-slate-900/60 text-white text-[8px] font-black px-1 py-0.5 rounded-md">{i + 1}/{mediaArr.length}</span>}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        {activeClientId === 'geral' && <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{INITIAL_CLIENTS.find(c => c.id === post.clientId)?.name}</p>}
                        <p className="text-slate-700 text-sm font-medium line-clamp-3 mb-2 whitespace-pre-wrap">{post.content}</p>
                        <p className="text-indigo-600 text-[11px] font-black truncate">{post.hashtags}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 mt-6 pt-6 border-t border-slate-50 overflow-hidden">
                      <div className="flex items-center gap-1 min-w-0">
                        {!isClientView && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); setEditingId(post.id); setFormState({...post}); setIsModalOpen(true); }} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 border border-slate-100 transition-all flex-shrink-0"><Edit3 size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} className="p-1.5 bg-slate-50 text-slate-300 rounded-xl hover:text-rose-600 border border-slate-100 flex-shrink-0"><Trash2 size={16} /></button>
                          </>
                        )}
                        {post.status === 'pendente' && <button onClick={(e) => { e.stopPropagation(); if(confirm("Rejeitar?")) setDoc(doc(db, 'agencias', 'aoki', 'posts', post.id), { status: 'rejeitado' }, { merge: true }); }} className="bg-slate-50 text-rose-500 px-2 py-1.5 rounded-xl text-[10px] font-black border border-rose-100 truncate">Rejeitar</button>}
                      </div>
                      {post.status === 'pendente' && <button onClick={(e) => { e.stopPropagation(); setDoc(doc(db, 'agencias', 'aoki', 'posts', post.id), { status: 'aprovado' }, { merge: true }); }} className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg truncate">Aprovar Postagem</button>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* PREVIEW DO CELULAR COM CARROSSEL E BOLINHAS */}
            <div className="hidden xl:block sticky top-10 space-y-6">
             {previewPost && (
                <div className="flex justify-center gap-2 bg-white p-2 rounded-[1.5rem] border border-slate-200 shadow-sm w-fit mx-auto">
                  {previewPost.platforms.map(plt => (
                    <button key={plt} onClick={() => setPreviewPlatform(plt)} className={`w-20 py-3 rounded-xl transition-all ${previewPlatform === plt ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {plt === 'instagram' && <Instagram size={18} className="mx-auto" />}
                      {plt === 'facebook' && <Facebook size={18} className="mx-auto" />}
                      {plt === 'linkedin' && <Linkedin size={18} className="mx-auto" />}
                    </button>
                  ))}
                </div>
              )}
              <div className="bg-slate-900 rounded-[4rem] p-4 shadow-2xl relative border-[12px] border-slate-800 mx-auto w-[340px] h-[640px]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-slate-800 rounded-b-[2rem] z-20 flex items-center justify-center"><div className="w-14 h-1.5 bg-slate-700 rounded-full" /></div>
                <div className="bg-white rounded-[3rem] h-full overflow-hidden flex flex-col relative shadow-inner">
                  {previewPost ? (
                    <div className="flex-1 overflow-y-auto bg-slate-50 pt-10 pb-24">
                       <div className="bg-white px-5 py-4 border-b border-slate-50 flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-300 uppercase">{previewPlatform}</span>
                          <Smartphone size={14} className="text-slate-200" />
                       </div>
                       <div className="p-4">
                         {/* CONTAINER DO CARROSSEL NO CELULAR */}
                         <div className="relative group mb-4">
                            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-2xl shadow-sm border border-slate-100 bg-white aspect-[4/5]">
                              {(() => {
                                const mArr = Array.isArray(previewPost.media) ? previewPost.media : (previewPost.media ? [previewPost.media] : []);
                                return mArr.map((m, i) => (
                                  <div key={i} className="w-full shrink-0 snap-center flex items-center justify-center bg-slate-50">
                                    {m.type === 'video' ? <video src={m.url} className="w-full h-full object-contain" /> : <img src={m.url} className="w-full h-full object-contain" />}
                                  </div>
                                ));
                              })()}
                            </div>
                            {/* BOLINHAS (INDICADORES) DO CARROSSEL */}
                            {Array.isArray(previewPost.media) && previewPost.media.length > 1 && (
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/20 backdrop-blur-md rounded-full">
                                {previewPost.media.map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
                                ))}
                              </div>
                            )}
                         </div>
                         <p className="text-[12.5px] text-slate-800 font-medium whitespace-pre-wrap">{previewPost.content}</p>
                         <p className="text-[12.5px] text-indigo-600 font-bold mt-2">{previewPost.hashtags}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-200 opacity-20"><Smartphone size={48} className="mb-4" /><p className="text-[10px] font-black uppercase">Selecione um post</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-xl z-10">
              <h2 className="text-2xl font-black text-slate-900">{editingId ? 'Editar Post' : 'Novo Conteúdo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:rotate-90 transition-all"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Destino</label>
                    <div className="flex gap-2">
                      {['instagram', 'facebook', 'linkedin'].map(plt => (
                        <button key={plt} type="button" onClick={() => setFormState(prev => ({ ...prev, platforms: prev.platforms.includes(plt) ? prev.platforms.filter(p => p !== plt) : [...prev.platforms, plt] }))} className={`flex-1 py-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase ${formState.platforms.includes(plt) ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400'}`}>{plt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Formato</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[ { id: 'estatico', icon: <Square size={16} />, label: 'Post' }, { id: 'carrossel', icon: <Layers size={16} />, label: 'Album' }, { id: 'reel', icon: <Film size={16} />, label: 'Vídeo' } ].map(type => (
                        <button key={type.id} type="button" onClick={() => setFormState({...formState, postType: type.id})} className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${formState.postType === type.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>{type.icon} <span className="text-[9px] font-black uppercase">{type.label}</span></button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">Mídia</label>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" multiple={formState.postType === 'carrossel'} />
                    <div className="flex gap-3 overflow-x-auto w-full pb-2 scrollbar-hide items-start">
                      <div onClick={() => fileInputRef.current.click()} className="h-24 w-24 shrink-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all">
                        <Plus size={24} className="text-indigo-500 mb-1" />
                        <span className="text-[9px] font-black text-slate-500 uppercase">Upload</span>
                      </div>
                      {(() => {
                        const mArr = Array.isArray(formState.media) ? formState.media : (formState.media ? [formState.media] : []);
                        return mArr.map((m, i) => (
                          <div key={i} className="h-24 w-24 shrink-0 relative rounded-[1.5rem] overflow-hidden border border-slate-200 group/item">
                            <img src={m.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                              <button type="button" onClick={() => removeMedia(i)} className="bg-rose-500 text-white p-1.5 rounded-lg"><Trash2 size={12} /></button>
                              <div className="flex gap-2">
                                {i > 0 && <button type="button" onClick={() => moveMedia(i, -1)} className="bg-white/20 text-white p-1 rounded"><ChevronLeft size={14} /></button>}
                                {i < mArr.length - 1 && <button type="button" onClick={() => moveMedia(i, 1)} className="bg-white/20 text-white p-1 rounded"><ChevronRight size={14} /></button>}
                              </div>
                            </div>
                            <span className="absolute top-1 left-1 bg-slate-900/60 text-white text-[8px] font-black px-1 py-0.5 rounded-md">{i + 1}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100">
                    <label className="block text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest">Agendamento</label>
                    <div className="space-y-3">
                      <input type="date" required className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-xs font-black outline-none" value={formState.scheduleDate} onChange={(e) => setFormState({...formState, scheduleDate: e.target.value})} />
                      <input type="time" required className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-xs font-black outline-none" value={formState.scheduleTime} onChange={(e) => setFormState({...formState, scheduleTime: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Legenda</label>
                    <textarea required rows={5} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium outline-none resize-none leading-relaxed" value={formState.content} onChange={(e) => setFormState({...formState, content: e.target.value})} placeholder="Escreve aqui..."></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Hashtags</label>
                    <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-black outline-none" value={formState.hashtags} onChange={(e) => setFormState({...formState, hashtags: e.target.value})} placeholder="#aoki #socialmedia" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase hover:text-slate-600 transition-colors">Sair</button>
                <button type="submit" disabled={formState.platforms.length === 0} className={`flex-[2] py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${formState.platforms.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
