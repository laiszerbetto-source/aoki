// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  CheckCircle2, XCircle, Clock, Send, Plus, Trash2, Smartphone, Eye, Copy, Image as ImageIcon, Film, 
  Hash, Check, Layers, Square, ThumbsUp, MessageSquare, Share2, Edit3, Globe, Calendar, AlertCircle, Briefcase, Loader2, Share, ChevronLeft, ChevronRight, LayoutGrid, FileDown, SendHorizonal, Maximize2
} from 'lucide-react';

// --- ÍCONES DE REDES SOCIAIS ---
const Instagram = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const Facebook = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);
const Linkedin = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);

// --- CONFIGURAÇÃO DO FIREBASE (AOKI) ---
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
const storage = getStorage(app);

const INITIAL_CLIENTS = [
  { id: 'geral', name: 'Visão Geral (Agência)', handle: 'aokimidias', color: 'from-indigo-600 to-purple-700' },
  { id: 'c1', name: 'Grupo Aoki', handle: 'grupoaoki', color: 'from-slate-700 to-black' },
  { id: 'c2', name: 'Ford Aoki', handle: 'fordaoki', color: 'from-blue-600 to-blue-900' },
  { id: 'c3', name: 'Mercedes Aoki', handle: 'mercedesaoki', color: 'from-slate-300 to-slate-500' },
  { id: 'c4', name: 'Consórcios Aoki', handle: 'consorciosaoki', color: 'from-emerald-500 to-teal-700' },
  { id: 'c5', name: 'NAKI Autopeças', handle: 'nakiautopecas', color: 'from-red-600 to-red-800' }
];

const MediaCarousel = ({ media, isPreview = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const mediaArr = Array.isArray(media) ? media : (media ? [media] : []);

  if (mediaArr.length === 0) {
    return <div className="w-full h-full flex items-center justify-center bg-slate-50"><ImageIcon size={24} className="text-slate-200" /></div>;
  }

  const next = (e) => { e.stopPropagation(); if (currentIndex < mediaArr.length - 1) setCurrentIndex(prev => prev + 1); };
  const prev = (e) => { e.stopPropagation(); if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

  return (
    <div className="relative w-full h-full group/carousel overflow-hidden bg-white rounded-inherit">
      <div className="flex w-full h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {mediaArr.map((m, i) => (
          <div key={i} className="w-full h-full shrink-0 flex items-center justify-center relative bg-white">
            {m.type === 'video' ? <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center"><Film size={20} /></div> : <img src={m.url} className={`w-full h-full object-contain ${!isPreview && 'p-1'}`} />}
          </div>
        ))}
      </div>
      {mediaArr.length > 1 && (
        <>
          <button type="button" onClick={prev} className={`absolute left-1 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity z-10 ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/carousel:opacity-100'} ${isPreview ? 'w-8 h-8' : 'w-5 h-5'}`}><ChevronLeft size={isPreview ? 20 : 14} /></button>
          <button type="button" onClick={next} className={`absolute right-1 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity z-10 ${currentIndex === mediaArr.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/carousel:opacity-100'} ${isPreview ? 'w-8 h-8' : 'w-5 h-5'}`}><ChevronRight size={isPreview ? 20 : 14} /></button>
          {isPreview ? (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/30 backdrop-blur-md rounded-full">
              {mediaArr.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all duration-300 ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />)}
            </div>
          ) : (
            <span className="absolute top-1 right-1 bg-slate-900/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md z-10 backdrop-blur-sm">{currentIndex + 1}/{mediaArr.length}</span>
          )}
        </>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [activeClientId, setActiveClientId] = useState(INITIAL_CLIENTS[0].id);
  const [activeTab, setActiveTab] = useState('todos');
  const [mainView, setMainView] = useState('feed');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isClientView, setIsClientView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [feedbackPost, setFeedbackPost] = useState(null);
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');
  const [zoomedPost, setZoomedPost] = useState(null);

  const [draggedMediaIdx, setDraggedMediaIdx] = useState(null);

  const [formState, setFormState] = useState({
    content: '', platforms: [], hashtags: '', postType: 'estatico',
    media: null, scheduleDate: '', scheduleTime: ''
  });

  const fileInputRef = useRef(null);
  const currentClient = INITIAL_CLIENTS.find(c => c.id === activeClientId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') setIsClientView(true);
  }, []);

  useEffect(() => {
    if (currentClient) document.title = isClientView ? `Aprovação: ${currentClient.name} | Aoki` : `${currentClient.name} | SocialFlow Aoki`;
  }, [currentClient, isClientView]);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro auth:", err));
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); if (!u) setIsLoading(false); });
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
    if (feedbackPost) { const updated = posts.find(p => p.id === feedbackPost.id); if (updated) setFeedbackPost(updated); }
    if (zoomedPost) { const updated = posts.find(p => p.id === zoomedPost.id); if (updated) setZoomedPost(updated); }
  }, [posts]);

  const filteredPosts = posts.filter(p => {
    const clientMatch = activeClientId === 'geral' ? true : p.clientId === activeClientId;
    const statusMatch = activeTab === 'todos' || p.status === activeTab;
    return clientMatch && statusMatch;
  });

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploadError('');
    if (files.length === 0) return;
    const newMedia = files.map(file => ({ type: file.type.startsWith('video') ? 'video' : 'image', url: URL.createObjectURL(file), file: file }));
    setFormState(prev => ({ ...prev, media: prev.postType === 'carrossel' ? [...(Array.isArray(prev.media) ? prev.media : (prev.media ? [prev.media] : [])), ...newMedia] : newMedia[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.content.trim() || formState.platforms.length === 0) return;
    setIsUploading(true);

    try {
      let finalMediaData = null;
      if (formState.media) {
        const mediaArray = Array.isArray(formState.media) ? formState.media : [formState.media];
        const processedMedia = [];
        for (const m of mediaArray) {
          if (m.file) {
            const fileRef = ref(storage, `agencias/aoki/posts/${Date.now()}_${m.file.name}`);
            await uploadBytes(fileRef, m.file);
            const downloadUrl = await getDownloadURL(fileRef);
            processedMedia.push({ type: m.type, url: downloadUrl });
          } else {
            processedMedia.push(m);
          }
        }
        finalMediaData = formState.postType === 'carrossel' ? processedMedia : processedMedia[0];
      }

      const id = editingId || Date.now().toString();
      await setDoc(doc(db, 'agencias', 'aoki', 'posts', id), {
        ...formState, media: finalMediaData, clientId: activeClientId === 'geral' ? 'c1' : activeClientId,
        status: editingId ? (posts.find(p => p.id === editingId)?.status || 'pendente') : 'pendente',
        date: editingId ? posts.find(p => p.id === editingId).date : new Date().toISOString(),
      }, { merge: true });

      setIsModalOpen(false); setEditingId(null);
      setFormState({ content: '', platforms: [], hashtags: '', postType: 'estatico', media: null, scheduleDate: '', scheduleTime: '' });
    } catch (err) { setUploadError("Erro ao guardar. Verifique regras do Storage."); } finally { setIsUploading(false); }
  };

  const removeMedia = (index) => {
    setFormState(prev => {
      const newMedia = Array.isArray(prev.media) ? [...prev.media] : [prev.media];
      newMedia.splice(index, 1);
      return { ...prev, media: newMedia.length > 0 ? (prev.postType === 'carrossel' ? newMedia : newMedia[0]) : null };
    });
  };

  const deletePost = async (id) => { if (confirm("Apagar rascunho permanentemente?")) await deleteDoc(doc(db, 'agencias', 'aoki', 'posts', id)); };

  const copyClientLink = () => {
    const url = new URL(window.location.href); url.searchParams.set('view', 'client');
    const textArea = document.createElement("textarea"); textArea.value = url.toString();
    document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea);
    alert("Link copiado!");
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!newFeedbackMessage.trim() || !feedbackPost) return;
    const authorRole = isClientView ? 'Cliente' : 'Agência';
    const newMsg = { text: newFeedbackMessage.trim(), author: authorRole, date: new Date().toISOString() };
    const updatedFeedbacks = [...(feedbackPost.feedbacks || []), newMsg];
    await setDoc(doc(db, 'agencias', 'aoki', 'posts', feedbackPost.id), { feedbacks: updatedFeedbacks }, { merge: true });
    setNewFeedbackMessage('');
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear(); const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); const days = new Date(year, month + 1, 0).getDate();
    return { firstDay, days };
  };

  const changePostStatus = (id, newStatus, e) => {
    if (e) e.stopPropagation();
    setDoc(doc(db, 'agencias', 'aoki', 'posts', id), { status: newStatus }, { merge: true });
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse text-xl"><Loader2 className="animate-spin mr-3" /> Sincronizando Flow...</div>;

  return (
    <>
    <div className="fixed inset-0 flex flex-col md:flex-row bg-[#F8FAFC] font-sans text-slate-900 antialiased overflow-hidden print:hidden relative">
      
      {/* SIDEBAR RESPONSIVA */}
      <aside className="w-full md:w-72 bg-white border-b md:border-r border-slate-200 p-5 md:p-6 flex flex-col gap-6 max-h-[35vh] md:max-h-none md:h-full overflow-y-auto overflow-x-hidden z-20 shrink-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">  
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
          <div className="mt-auto space-y-3 pb-2 md:pb-0">
             <button onClick={() => window.print()} className="w-full bg-slate-50 text-slate-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all text-xs border border-slate-200"><FileDown size={16} /> Exportar PDF</button>
             <button onClick={copyClientLink} className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-xs border border-slate-200"><Share size={16} /> Link p/ Cliente</button>
          </div>
        )}
      </aside>

      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-4 md:p-10 min-w-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        <header className="mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-4 h-4 rounded-lg bg-gradient-to-tr ${currentClient?.color} shadow-sm`} />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{currentClient?.name}</h2>
            </div>
            <p className="text-slate-400 text-xs md:text-sm font-medium italic">{isClientView ? 'Aprovação de Conteúdo' : 'Dashboard Aoki'}</p>
          </div>
        </header>

        {mainView === 'feed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 w-full items-start content-start pb-24">
            {filteredPosts.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-10 md:p-20 text-center flex flex-col items-center md:col-span-2 xl:col-span-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest"><ImageIcon className="w-12 h-12 mb-4 text-slate-200" /> Sem rascunhos</div>
            ) : (
              filteredPosts.map(post => (
                <div key={post.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm transition-all hover:shadow-2xl overflow-hidden flex flex-col group h-[620px]">
                  
                  {/* IMAGEM E STATUS (ESTRUTURA CAMADAS) */}
                  <div className="h-[280px] w-full bg-slate-50 relative border-b border-slate-50 shrink-0">
                    <MediaCarousel media={post.media} isPreview={false} />
                    <div className="absolute top-4 left-4 flex gap-2">
                      {post.platforms.map(plt => (
                        <div key={plt} className="p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-sm text-indigo-600 border border-white">
                          {plt === 'instagram' && <Instagram size={14} />}
                          {plt === 'facebook' && <Facebook size={14} />}
                          {plt === 'linkedin' && <Linkedin size={14} />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CONTEÚDO (ESTRUTURA CAMADAS) */}
                  <div className="p-6 md:p-7 flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      <div className="flex items-center gap-2 text-indigo-600/50 bg-indigo-50/50 w-fit px-3 py-1.5 rounded-full border border-indigo-100/50">
                        <Calendar size={14} />
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tight">
                          {post.scheduleDate ? `${post.scheduleDate.split('-').reverse().join('/')} às ${post.scheduleTime}` : 'Imediato'}
                        </span>
                      </div>
                      
                      {!isClientView && (
                        <select 
                          value={post.status} 
                          onChange={(e) => changePostStatus(post.id, e.target.value, e)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase border outline-none cursor-pointer appearance-none text-center ${post.status === 'aprovado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : post.status === 'rejeitado' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="aprovado">Aprovado</option>
                          <option value="rejeitado">Rejeitado</option>
                        </select>
                      )}
                      {isClientView && (
                         <span className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase border text-center ${post.status === 'aprovado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : post.status === 'rejeitado' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                           {post.status}
                         </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto mb-4 scrollbar-hide">
                      {activeClientId === 'geral' && <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{INITIAL_CLIENTS.find(c => c.id === post.clientId)?.name}</p>}
                      <p className="text-slate-700 text-sm font-medium leading-relaxed italic">"{post.content}"</p>
                    </div>
                    
                    {post.hashtags && (
                      <p className="text-indigo-500 text-[10px] md:text-[11px] font-black mb-4 truncate shrink-0">
                        {post.hashtags}
                      </p>
                    )}

                    {/* BASE E BOTÕES (ESTRUTURA CAMADAS) */}
                    <div className="pt-5 border-t border-slate-50 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1 min-w-0">
                        <button onClick={() => setZoomedPost(post)} className="p-2 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex-shrink-0" title="Ampliar"><Maximize2 size={16} className="md:w-[18px] md:h-[18px]" /></button>
                        <button onClick={() => setFeedbackPost(post)} className="p-2 bg-slate-50 text-indigo-500 rounded-xl hover:bg-indigo-50 border border-transparent transition-all flex-shrink-0 relative" title="Chat">
                          <MessageSquare size={16} className="md:w-[18px] md:h-[18px]" />
                          {post.feedbacks?.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>}
                        </button>
                        
                        {!isClientView && (
                          <>
                            <button onClick={() => { setEditingId(post.id); setFormState({...post}); setIsModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 transition-colors flex-shrink-0" title="Editar"><Edit3 size={16} className="md:w-[18px] md:h-[18px]" /></button>
                            <button onClick={() => deletePost(post.id)} className="p-2 bg-slate-50 text-slate-300 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0" title="Excluir"><Trash2 size={16} className="md:w-[18px] md:h-[18px]" /></button>
                          </>
                        )}
                      </div>
                      
                      <div className="flex gap-1 md:gap-1.5 shrink-0">
                        {post.status !== 'rejeitado' && <button onClick={() => changePostStatus(post.id, 'rejeitado')} className="bg-slate-50 text-rose-500 px-3 md:px-4 py-2 rounded-[1.2rem] text-[9px] md:text-[10px] font-black border border-rose-100 truncate hover:bg-rose-100 transition-colors uppercase tracking-widest">Rejeitar</button>}
                        {post.status !== 'aprovado' && <button onClick={() => changePostStatus(post.id, 'aprovado')} className="bg-emerald-500 text-white px-3 md:px-4 py-2 rounded-[1.2rem] text-[9px] md:text-[10px] font-black shadow-lg truncate hover:bg-emerald-600 transition-colors uppercase tracking-widest">Aprovar</button>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW: CALENDÁRIO COM DRAG AND DROP */}
        {mainView === 'calendario' && (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden pb-24 md:pb-0 mb-24">
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4 md:gap-6">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 md:p-3 hover:bg-slate-50 rounded-full text-slate-400"><ChevronLeft /></button>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tighter">{currentMonth.toLocaleString('pt-PT', { month: 'long', year: 'numeric' })}</h3>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 md:p-3 hover:bg-slate-50 rounded-full text-slate-400"><ChevronRight /></button>
               </div>
            </div>

            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="py-3 md:py-4 text-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[120px] md:auto-rows-[160px]">
              {(() => {
                const { firstDay, days } = getDaysInMonth(currentMonth);
                const cells = [];
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="border-r border-b border-slate-50 bg-slate-50/30"></div>);
                }
                for (let d = 1; d <= days; d++) {
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const dayPosts = filteredPosts.filter(p => p.scheduleDate === dateStr);
                  
                  cells.push(
                    <div 
                      key={d} 
                      onDragOver={(e) => !isClientView && e.preventDefault()}
                      onDrop={(e) => {
                        if(isClientView) return;
                        e.preventDefault();
                        const postId = e.dataTransfer.getData('postId');
                        if (postId) setDoc(doc(db, 'agencias', 'aoki', 'posts', postId), { scheduleDate: dateStr }, { merge: true });
                      }}
                      className="border-r border-b border-slate-100 p-1 md:p-3 flex flex-col gap-1 md:gap-1.5 hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-[10px] md:text-xs font-black text-slate-300 group-hover:text-indigo-600 pl-1 md:pl-0">{d}</span>
                      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide px-1 md:px-0">
                        {dayPosts.map(p => (
                          <div 
                            key={p.id}
                            draggable={!isClientView}
                            onDragStart={(e) => e.dataTransfer.setData('postId', p.id)}
                            onClick={() => setZoomedPost(p)}
                            className={`p-1.5 rounded-lg border flex flex-col gap-1 cursor-pointer hover:scale-[1.02] shadow-sm ${
                              p.status === 'aprovado' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'
                            }`}
                          >
                             <div className="flex justify-between items-center pointer-events-none">
                                <span className="text-[8px] font-black text-slate-500">{p.scheduleTime}</span>
                                {p.media && <div className="hidden md:block w-4 h-4 rounded-sm overflow-hidden bg-slate-200"><img src={Array.isArray(p.media) ? p.media[0].url : p.media.url} className="w-full h-full object-cover" /></div>}
                             </div>
                             <p className="text-[8px] font-medium text-slate-700 line-clamp-1 md:line-clamp-2 leading-tight pointer-events-none">{p.content}</p>
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

      {/* FAB: BOTÃO FLUTUANTE DE NOVO POST */}
      {!isClientView && (
        <button 
          onClick={() => { setEditingId(null); setFormState({ content: '', platforms: [], hashtags: '', postType: 'estatico', media: null, scheduleDate: '', scheduleTime: '' }); setIsModalOpen(true); }}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-indigo-600 text-white h-14 w-14 md:h-auto md:w-auto md:px-8 md:py-4 rounded-full font-black shadow-[0_10px_40px_-10px_rgba(79,70,229,0.8)] hover:bg-indigo-700 hover:-translate-y-1 transition-all z-40 flex items-center justify-center gap-3 group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" /> 
          <span className="hidden md:block uppercase tracking-widest text-[11px]">Novo Post</span>
        </button>
      )}

      {/* MODAL DE ZOOM */}
      {zoomedPost && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8" onClick={() => setZoomedPost(null)}>
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomedPost(null)} className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><XCircle size={24} /></button>
            
            <div className="w-full md:w-1/2 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-6 md:p-8 flex items-center justify-center min-h-[250px] md:min-h-[300px]">
               <div className="w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-white">
                  <MediaCarousel media={zoomedPost.media} isPreview={true} />
               </div>
            </div>
            
            <div className="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto flex flex-col">
               <div className="flex gap-2 mb-4 md:mb-6">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-lg border border-slate-200">{zoomedPost.postType}</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${zoomedPost.status === 'aprovado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : zoomedPost.status === 'rejeitado' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{zoomedPost.status}</span>
               </div>
               
               <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2">Detalhes da Postagem</h3>
               <p className="text-xs md:text-sm font-bold text-indigo-600 flex items-center gap-2 mb-6 md:mb-8 bg-indigo-50 w-fit px-4 py-2 rounded-xl"><Calendar size={14} className="md:w-4 md:h-4" /> {zoomedPost.scheduleDate ? `${zoomedPost.scheduleDate.split('-').reverse().join('/')} às ${zoomedPost.scheduleTime}` : 'Imediato'}</p>
               
               <div className="bg-slate-50 p-5 md:p-6 rounded-3xl border border-slate-100 mb-6">
                  <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">{zoomedPost.content}</p>
               </div>
               <p className="text-sm font-black text-indigo-600 mb-8">{zoomedPost.hashtags}</p>
               
               <div className="mt-auto pt-4 md:pt-6 border-t border-slate-100 flex gap-2">
                  {zoomedPost.status !== 'rejeitado' && <button onClick={() => changePostStatus(zoomedPost.id, 'rejeitado')} className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-2xl font-black text-[10px] md:text-xs hover:bg-rose-100 transition-colors uppercase tracking-widest">Rejeitar</button>}
                  {zoomedPost.status !== 'aprovado' && <button onClick={() => changePostStatus(zoomedPost.id, 'aprovado')} className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl font-black text-[10px] md:text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-colors uppercase tracking-widest">Aprovar Post</button>}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO/EDITAR POST COM UPLOAD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-xl z-10">
              <h2 className="text-xl md:text-2xl font-black text-slate-900">{editingId ? 'Editar Post' : 'Novo Conteúdo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 md:p-3 bg-slate-100 rounded-2xl text-slate-400 hover:rotate-90 transition-all"><XCircle size={20} className="md:w-6 md:h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 md:space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 md:mb-4 tracking-widest">Destino</label>
                    <div className="flex gap-2">
                      {['instagram', 'facebook', 'linkedin'].map(plt => (
                        <button key={plt} type="button" onClick={() => setFormState(prev => ({ ...prev, platforms: prev.platforms.includes(plt) ? prev.platforms.filter(p => p !== plt) : [...prev.platforms, plt] }))} className={`flex-1 py-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase ${formState.platforms.includes(plt) ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400'}`}>{plt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 md:mb-4 tracking-widest">Formato</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[ { id: 'estatico', icon: <Square size={16} />, label: 'Post' }, { id: 'carrossel', icon: <Layers size={16} />, label: 'Album' }, { id: 'reel', icon: <Film size={16} />, label: 'Vídeo' } ].map(type => (
                        <button key={type.id} type="button" onClick={() => setFormState({...formState, postType: type.id})} className={`flex flex-col items-center gap-2 py-3 md:py-4 rounded-2xl border-2 transition-all ${formState.postType === type.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>{type.icon} <span className="text-[9px] font-black uppercase">{type.label}</span></button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 md:mb-4 tracking-widest flex items-center gap-2">Mídia (Arraste p/ Reordenar)</label>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" multiple={formState.postType === 'carrossel'} />
                    <div className="flex gap-3 overflow-x-auto w-full pb-2 scrollbar-hide items-start">
                      <div onClick={() => fileInputRef.current.click()} className="h-20 w-20 md:h-24 md:w-24 shrink-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all">
                        <Plus size={24} className="text-indigo-500 mb-1" />
                        <span className="text-[9px] font-black text-slate-500 uppercase">Upload</span>
                      </div>
                      {(() => {
                        const mArr = Array.isArray(formState.media) ? formState.media : (formState.media ? [formState.media] : []);
                        return mArr.map((m, i) => (
                          <div 
                            key={i} draggable onDragStart={() => setDraggedMediaIdx(i)} onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); if (draggedMediaIdx === null || draggedMediaIdx === i) return; setFormState(prev => { const newMedia = [...prev.media]; const temp = newMedia[draggedMediaIdx]; newMedia.splice(draggedMediaIdx, 1); newMedia.splice(i, 0, temp); return { ...prev, media: newMedia }; }); setDraggedMediaIdx(null); }}
                            className="h-20 w-20 md:h-24 md:w-24 shrink-0 relative rounded-[1.5rem] overflow-hidden border border-slate-200 group/item cursor-grab active:cursor-grabbing"
                          >
                            <img src={m.url} className="w-full h-full object-cover pointer-events-none" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm"><button type="button" onClick={() => removeMedia(i)} className="bg-rose-500 text-white p-2 rounded-xl hover:scale-110 transition-transform"><Trash2 size={14} className="md:w-4 md:h-4" /></button></div>
                            <span className="absolute top-1 left-1 bg-slate-900/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md pointer-events-none">{i + 1}</span>
                          </div>
                        ));
                      })()}
                    </div>
                    {uploadError && <p className="text-red-500 text-[10px] font-bold mt-2">{uploadError}</p>}
                  </div>
                </div>

                <div className="space-y-6 md:space-y-8">
                  <div className="bg-indigo-50/50 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-indigo-100">
                    <label className="block text-[10px] font-black text-indigo-400 uppercase mb-3 md:mb-4 tracking-widest">Agendamento</label>
                    <div className="space-y-3">
                      <input type="date" required className="w-full p-3 md:p-4 bg-white border border-indigo-100 rounded-xl md:rounded-2xl text-xs font-black outline-none" value={formState.scheduleDate} onChange={(e) => setFormState({...formState, scheduleDate: e.target.value})} />
                      <input type="time" required className="w-full p-3 md:p-4 bg-white border border-indigo-100 rounded-xl md:rounded-2xl text-xs font-black outline-none" value={formState.scheduleTime} onChange={(e) => setFormState({...formState, scheduleTime: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 md:mb-4 tracking-widest">Legenda</label>
                    <textarea required rows={4} className="w-full p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] md:rounded-[2rem] text-sm font-medium outline-none resize-none leading-relaxed" value={formState.content} onChange={(e) => setFormState({...formState, content: e.target.value})} placeholder="Escreve aqui..."></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 md:mb-4 tracking-widest">Hashtags</label>
                    <input type="text" className="w-full p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-[1rem] md:rounded-[1.5rem] text-xs font-black outline-none" value={formState.hashtags} onChange={(e) => setFormState({...formState, hashtags: e.target.value})} placeholder="#aoki #socialmedia" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 md:gap-4 pt-4 md:pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 md:py-5 text-slate-400 font-black text-[10px] uppercase hover:text-slate-600 transition-colors">Sair</button>
                <button type="submit" disabled={formState.platforms.length === 0 || isUploading} className={`flex-[2] flex items-center justify-center gap-2 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${formState.platforms.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {isUploading ? <><Loader2 size={16} className="animate-spin" /> A guardar...</> : (editingId ? 'Atualizar Post' : 'Lançar Post')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CHAT DE FEEDBACK */}
      {feedbackPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[500px] md:h-[600px] max-h-[90vh]">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2"><MessageSquare size={18} className="text-indigo-500" /> Chat do Post</h2>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {feedbackPost.status}</p>
              </div>
              <button onClick={() => setFeedbackPost(null)} className="p-2 bg-white rounded-xl text-slate-400 shadow-sm"><XCircle size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 bg-white">
              {(!feedbackPost.feedbacks || feedbackPost.feedbacks.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 opacity-50">
                  <MessageSquare size={32} />
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Sem mensagens</p>
                </div>
              ) : (
                feedbackPost.feedbacks.map((msg, i) => {
                  const isMine = (isClientView && msg.author === 'Cliente') || (!isClientView && msg.author === 'Agência');
                  return (
                    <div key={i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase mb-1">{msg.author} • {new Date(msg.date).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}</span>
                      <div className={`px-3 py-2 md:px-4 md:py-3 rounded-2xl max-w-[85%] text-xs md:text-sm font-medium leading-relaxed shadow-sm ${isMine ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <form onSubmit={handleSendFeedback} className="p-3 md:p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
              <input type="text" value={newFeedbackMessage} onChange={(e) => setNewFeedbackMessage(e.target.value)} placeholder="Comentário..." className="flex-1 px-3 py-2 md:px-4 md:py-3 rounded-xl border border-slate-200 text-xs md:text-sm font-medium outline-none focus:border-indigo-500 transition-colors" />
              <button type="submit" disabled={!newFeedbackMessage.trim()} className="p-2 md:p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex-shrink-0"><SendHorizonal size={18} className="md:w-5 md:h-5" /></button>
            </form>
          </div>
        </div>
      )}
    </div>

    {/* LAYOUT EXCLUSIVO PARA IMPRESSÃO/PDF */}
    <div className="hidden print:block bg-white p-8 font-sans">
      <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Relatório de Rascunhos</h1>
          <h2 className="text-lg font-bold text-slate-500">{currentClient?.name}</h2>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400">Data de Geração</p>
          <p className="text-lg font-black text-slate-900">{new Date().toLocaleDateString('pt-PT')}</p>
        </div>
      </div>

      <div className="space-y-12">
        {filteredPosts.length === 0 ? (
          <p className="text-center text-slate-400 font-bold">Não existem posts no filtro atual para exportar.</p>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="break-inside-avoid border border-slate-200 p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                <div className="flex gap-3">
                  <span className="font-black text-xs uppercase bg-slate-100 px-2 py-1 rounded text-slate-600">{post.platforms.join(' • ')}</span>
                  <span className="font-black text-xs uppercase bg-slate-100 px-2 py-1 rounded text-slate-600">{post.postType}</span>
                </div>
                <span className="font-black text-sm text-indigo-600">{post.scheduleDate ? `${post.scheduleDate.split('-').reverse().join('/')} às ${post.scheduleTime}` : 'Imediato'}</span>
              </div>
              
              <div className="flex gap-6">
                {post.media && (
                  <div className="w-48 shrink-0">
                    <img src={Array.isArray(post.media) ? post.media[0].url : post.media.url} className="w-full h-auto rounded-lg" />
                    {Array.isArray(post.media) && post.media.length > 1 && <p className="text-xs font-bold text-slate-400 mt-2 text-center">+ {post.media.length - 1} imagem(ns)</p>}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  <p className="text-sm font-bold text-indigo-600 mt-4">{post.hashtags}</p>
                  <div className="mt-4 inline-block px-3 py-1 bg-slate-100 rounded-md text-xs font-black uppercase text-slate-500">Status: {post.status}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </>
  );
}
