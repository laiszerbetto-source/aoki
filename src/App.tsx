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
  const [activeTab, setActiveTab] = useState('todos'); // todos, pendente, aprovado, rejeitado
  const [mainView, setMainView] = useState('feed'); // feed, calendario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [copiedType, setCopiedType] = useState(null);
  const [isClientView, setIsClientView] = useState(false);

  // Estados do Calendário
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
    const clientPosts = activeClientId === 'geral' 
      ? posts 
      : posts.filter(p => p.clientId === activeClientId);
    
    if (!previewPost || (activeClientId !== 'geral' && previewPost.clientId !== activeClientId)) {
      setPreviewPost(clientPosts[0] || null);
      if (clientPosts[0]) setPreviewPlatform(clientPosts[0].platforms[0]);
    }
  }, [activeClientId, posts]);

  // Filtro inteligente para Geral ou Cliente Específico
  const filteredPosts = posts.filter(p => {
    const clientMatch = activeClientId === 'geral' ? true : p.clientId === activeClientId;
    const statusMatch = activeTab === 'todos' || p.status === activeTab;
    return clientMatch && statusMatch;
  });

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    setUploadError('');
    if (file) {
      if (file.size > 5000000) {
        setUploadError('Ficheiro demasiado grande (Máximo 5MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState({ ...formState, media: { type: file.type.startsWith('video') ? 'video' : 'image', url: reader.result } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.content.trim() || formState.platforms.length === 0) return;
    try {
      const id = editingId || Date.now().toString();
      await setDoc(doc(db, 'agencias', 'aoki', 'posts', id), {
        ...formState,
        clientId: activeClientId === 'geral' ? 'c1' : activeClientId, // Se criar na visão geral, assume Grupo Aoki
        status: editingId ? (posts.find(p => p.id === editingId)?.status || 'pendente') : 'pendente',
        date: editingId ? posts.find(p => p.id === editingId).date : new Date().toISOString(),
        feedback: ''
      }, { merge: true });
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      setUploadError("Erro ao guardar. Tente uma imagem mais leve.");
    }
  };

  const deletePost = async (id) => {
    if (confirm("Apagar rascunho?")) await deleteDoc(doc(db, 'agencias', 'aoki', 'posts', id));
  };

  const copyToClipboard = (text, type) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
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
    alert("Link de aprovação copiado! Envie ao cliente.");
  };

  // Funções Auxiliares de Calendário
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
      {/* Sidebar */}
<aside className="w-full md:w-72 bg-white border-b md:border-r border-slate-200 p-5 md:p-6 flex flex-col gap-8 max-h-[45vh] md:max-h-none md:h-full overflow-y-auto overflow-x-hidden z-20 shrink-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">  
  <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <Send size={24} />
          </div>
          <span className="font-black text-2xl tracking-tighter">SocialFlow</span>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase size={12} /> Marca Aoki
            </p>
            <select 
              className="w-full bg-white border border-slate-200 text-sm font-bold rounded-xl px-4 py-3 outline-none cursor-pointer"
              value={activeClientId}
              onChange={(e) => setActiveClientId(e.target.value)}
            >
              {INITIAL_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <nav className="space-y-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-4">Visualização</p>
             <button onClick={() => setMainView('feed')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm transition-all ${mainView === 'feed' ? 'bg-slate-900 text-white font-bold shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <LayoutGrid size={18} /> Feed de Posts
             </button>
             <button onClick={() => setMainView('calendario')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm transition-all ${mainView === 'calendario' ? 'bg-slate-900 text-white font-bold shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Calendar size={18} /> Calendário
             </button>
          </nav>

          <nav className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-4">Status do Fluxo</p>
            {[
              { id: 'todos', label: 'Todos', icon: <Eye size={18} /> },
              { id: 'pendente', label: 'Pendentes', icon: <Clock size={18} className="text-amber-500" /> },
              { id: 'aprovado', label: 'Aprovados', icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
              { id: 'rejeitado', label: 'Rejeitados', icon: <XCircle size={18} className="text-rose-500" /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm transition-all ${activeTab === t.id ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>

        {!isClientView && (
          <div className="mt-auto space-y-3">
             <button onClick={copyClientLink} className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-xs border border-slate-200">
                <Share size={16} /> Partilhar Acesso
              </button>
              <button
                onClick={() => { setEditingId(null); setFormState({ content: '', platforms: [], hashtags: '', postType: 'estatico', media: null, scheduleDate: '', scheduleTime: '' }); setIsModalOpen(true); }}
                className="w-full bg-indigo-600 text-white py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"
              >
                <Plus size={20} /> Novo Conteúdo
              </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
<main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-5 md:p-10 min-w-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-4 h-4 rounded-lg bg-gradient-to-tr ${currentClient?.color} shadow-sm`} />
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentClient?.name}</h2>
            </div>
            <p className="text-slate-400 text-sm font-medium italic">
              {mainView === 'calendario' ? 'Cronograma Mensal de Publicações' : 'Controlo de Aprovações em Tempo Real'}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white border border-slate-200 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 shadow-sm">
              <Globe size={12} className="text-indigo-500" /> Sincronizado: {filteredPosts.length}
            </div>
          </div>
        </header>

{/* --- VIEW: FEED --- */}
        {mainView === 'feed' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-10">
            
            {/* A MÁGICA DAS 2 COLUNAS ACONTECE NESTA DIV ABAIXO: */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start content-start">
              
              {filteredPosts.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center flex flex-col items-center lg:col-span-2">
                  <ImageIcon className="text-slate-200 w-12 h-12 mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sem rascunhos para este filtro</p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div 
                    key={post.id}
                    onClick={() => { setPreviewPost(post); setPreviewPlatform(post.platforms[0]); }}
                    className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer hover:shadow-2xl relative ${previewPost?.id === post.id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 shadow-sm'}`}
                  >
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
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 border border-slate-200">
                            {post.postType === 'reel' ? <Film size={12} /> : post.postType === 'carrossel' ? <Layers size={12} /> : <Square size={12} />}
                            {post.postType}
                          </span>
                          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${post.status === 'aprovado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : post.status === 'rejeitado' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{post.status}</div>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-black flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
                          <Calendar size={14} /> {post.scheduleDate ? `${post.scheduleDate.split('-').reverse().join('/')} às ${post.scheduleTime}` : 'Imediato'}
                        </span>
                      </div>
                    </div>

<div className="flex gap-6">
                      <div className="w-28 shrink-0 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative shadow-inner flex items-center justify-center">
                        {post.media ? (post.media.type === 'video' ? <div className="w-full aspect-square flex items-center justify-center bg-slate-900 text-white opacity-40"><Film size={24} /></div> : <img src={post.media.url} className="w-full h-auto max-h-48 object-contain" />) : <div className="p-8"><ImageIcon size={24} className="text-slate-200" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        {activeClientId === 'geral' && (
                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                            {INITIAL_CLIENTS.find(c => c.id === post.clientId)?.name}
                          </p>
                        )}
                        <p className="text-slate-700 text-sm font-medium leading-relaxed line-clamp-3 mb-3 whitespace-pre-wrap">{post.content}</p>
                        <p className="text-indigo-600 text-[11px] font-black tracking-tight truncate">{post.hashtags}</p>
                      </div>
                    </div>

       <div className="flex items-center justify-between gap-1.5 mt-6 pt-6 border-t border-slate-50 overflow-hidden">
                      <div className="flex items-center gap-1 flex-shrink-1 min-w-0">
                        {!isClientView && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); setEditingId(post.id); setFormState({...post}); setIsModalOpen(true); }} className="p-1.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 border border-slate-100 transition-all flex-shrink-0"><Edit3 size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} className="p-1.5 bg-slate-50 text-slate-300 rounded-xl hover:text-rose-600 border border-slate-100 transition-all flex-shrink-0"><Trash2 size={16} /></button>
                          </>
                        )}
                        {post.status === 'pendente' && (
                          <button onClick={(e) => { e.stopPropagation(); if(confirm("Rejeitar este post?")) setDoc(doc(db, 'agencias', 'aoki', 'posts', post.id), { status: 'rejeitado' }, { merge: true }); }} className="bg-slate-50 text-rose-500 px-2.5 py-1.5 rounded-xl text-[10px] font-black border border-rose-100 hover:bg-rose-50 whitespace-nowrap flex-shrink-1 min-w-0 truncate">Rejeitar</button>
                        )}
                      </div>
                      {post.status === 'pendente' && (
                        <button onClick={(e) => { e.stopPropagation(); setDoc(doc(db, 'agencias', 'aoki', 'posts', post.id), { status: 'aprovado' }, { merge: true }); }} className="bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black shadow-lg shadow-emerald-50 active:scale-95 whitespace-nowrap text-center flex-shrink-1 min-w-0 truncate">Aprovar Postagem</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Preview Lateral Smartphone */}
            <div className="hidden xl:block sticky top-10 space-y-6">
             {previewPost && (
                <div className="flex justify-center gap-2 bg-white p-2 rounded-[1.5rem] border border-slate-200 shadow-sm w-fit mx-auto">
                  {previewPost.platforms.map(plt => (
                    <button key={plt} onClick={() => setPreviewPlatform(plt)} className={`w-20 flex items-center justify-center py-3 rounded-xl transition-all ${previewPlatform === plt ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {plt === 'instagram' && <Instagram size={18} />}
                      {plt === 'facebook' && <Facebook size={18} />}
                      {plt === 'linkedin' && <Linkedin size={18} />}
                    </button>
                  ))}
                </div>
              )}
              <div className="bg-slate-900 rounded-[4rem] p-4 shadow-2xl relative border-[12px] border-slate-800 mx-auto w-[340px] h-[640px]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-slate-800 rounded-b-[2rem] z-20 flex items-center justify-center"><div className="w-14 h-1.5 bg-slate-700 rounded-full" /></div>
                <div className="bg-white rounded-[3rem] h-full overflow-hidden flex flex-col relative shadow-inner">
                  {previewPost ? (
                    <div className="flex-1 overflow-y-auto bg-slate-50 pt-10 pb-24">
                       {/* Render Preview Layouts... (Simplificado para o Canvas) */}
                       <div className="bg-white px-5 py-4 border-b border-slate-50 flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{previewPlatform}</span>
                          <Smartphone size={14} className="text-slate-200" />
                       </div>
                       <div className="p-4">
                         {previewPost.media && <img src={previewPost.media.url} className="w-full rounded-2xl mb-4 shadow-sm border border-slate-100" />}
                         <p className="text-[12.5px] text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">{previewPost.content}</p>
                         <p className="text-[12.5px] text-indigo-600 font-bold mt-2">{previewPost.hashtags}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-200 opacity-20"><Smartphone size={48} className="mb-4" /><p className="text-[10px] font-black uppercase tracking-widest leading-loose">Selecione um post</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: CALENDÁRIO --- */}
        {mainView === 'calendario' && (
          <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
            {/* Header Calendário */}
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-6">
                  <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-50 rounded-full transition-all text-slate-400"><ChevronLeft /></button>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                    {currentMonth.toLocaleString('pt-PT', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-50 rounded-full transition-all text-slate-400"><ChevronRight /></button>
               </div>
               <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-xs font-bold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aprovados
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-xs font-bold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pendentes
                  </div>
               </div>
            </div>

            {/* Grelha de Dias */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[160px]">
              {(() => {
                const { firstDay, days } = getDaysInMonth(currentMonth);
                const cells = [];
                // Células vazias iniciais
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="border-r border-b border-slate-50 bg-slate-50/30"></div>);
                }
                // Dias do mês
                for (let d = 1; d <= days; d++) {
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const dayPosts = filteredPosts.filter(p => p.scheduleDate === dateStr);
                  
                  cells.push(
                    <div key={d} className="border-r border-b border-slate-100 p-3 flex flex-col gap-1.5 hover:bg-slate-50 transition-colors group">
                      <span className="text-xs font-black text-slate-300 group-hover:text-indigo-600">{d}</span>
                      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
                        {dayPosts.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => { setPreviewPost(p); setPreviewPlatform(p.platforms[0]); setMainView('feed'); }}
                            className={`p-1.5 rounded-lg border flex flex-col gap-1 cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${
                              p.status === 'aprovado' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'
                            }`}
                          >
                             <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-slate-500">{p.scheduleTime}</span>
                                {p.media && <div className="w-4 h-4 rounded-sm overflow-hidden bg-slate-200"><img src={p.media.url} className="w-full h-full object-cover" /></div>}
                             </div>
                             <p className="text-[8px] font-medium text-slate-700 line-clamp-2 leading-tight">{p.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Modal Novo/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-xl z-10">
              <h2 className="text-2xl font-black text-slate-900">{editingId ? 'Editar Post' : 'Novo Conteúdo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Redes de Destino</label>
                    <div className="flex gap-2">
                      {['instagram', 'facebook', 'linkedin'].map(plt => (
                        <button key={plt} type="button" onClick={() => { setFormState(prev => ({ ...prev, platforms: prev.platforms.includes(plt) ? prev.platforms.filter(p => p !== plt) : [...prev.platforms, plt] })); }} className={`flex-1 py-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase ${formState.platforms.includes(plt) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>{plt}</button>
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Midia (Máx. 5MB)</label>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" />
                    <div onClick={() => fileInputRef.current.click()} className={`aspect-video bg-slate-50 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all ${uploadError ? 'border-red-400' : 'border-slate-200'}`}>
                      {formState.media ? <img src={formState.media.url} className="w-full h-full object-cover" /> : (
                        <div className="text-center group-hover:scale-110 transition-transform"><Plus size={32} className="text-indigo-500 mx-auto mb-2" /><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upload</p></div>
                      )}
                    </div>
                    {uploadError && <p className="text-red-500 text-[10px] font-bold mt-3">{uploadError}</p>}
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 shadow-inner">
                    <label className="block text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest flex items-center gap-2"><Clock size={14} /> Agenda Aoki</label>
                    <div className="space-y-3">
                      <input type="date" required className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-xs font-black text-indigo-900 outline-none" value={formState.scheduleDate} onChange={(e) => setFormState({...formState, scheduleDate: e.target.value})} />
                      <input type="time" required className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-xs font-black text-indigo-900 outline-none" value={formState.scheduleTime} onChange={(e) => setFormState({...formState, scheduleTime: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Legenda</label>
                    <textarea required rows={5} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium outline-none resize-none leading-relaxed" value={formState.content} onChange={(e) => setFormState({...formState, content: e.target.value})} placeholder="Escreve aqui..."></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Hashtags</label>
                    <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-black outline-none transition-all" value={formState.hashtags} onChange={(e) => setFormState({...formState, hashtags: e.target.value})} placeholder="#aoki #socialmedia" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Sair</button>
                <button type="submit" disabled={formState.platforms.length === 0} className={`flex-[2] py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${formState.platforms.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {editingId ? 'Atualizar Post' : 'Lançar no Fluxo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
