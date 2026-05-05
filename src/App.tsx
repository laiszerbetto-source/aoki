import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  CheckCircle2, XCircle, Clock, Send, Instagram, Facebook, Linkedin, 
  Plus, Trash2, Smartphone, Eye, Copy, Image as ImageIcon, Film, 
  Hash, Check, Layers, Square, Music2, Filter, MoreHorizontal, 
  ThumbsUp, MessageSquare, Share2, Edit3, Globe, Calendar, AlertCircle, Briefcase, Loader2
} from 'lucide-react';

// --- A SUA CONFIGURAÇÃO DO FIREBASE ---
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

// Lista de Clientes da Agência
const INITIAL_CLIENTS = [
  { id: 'c1', name: 'Grupo Aoki', handle: 'grupoaoki', color: 'from-slate-700 to-black' },
  { id: 'c2', name: 'Ford Aoki', handle: 'fordaoki', color: 'from-blue-600 to-blue-900' },
  { id: 'c3', name: 'Mercedes Aoki', handle: 'mercedesaoki', color: 'from-slate-300 to-slate-500' },
  { id: 'c4', name: 'Consórcios Aoki', handle: 'consorciosaoki', color: 'from-emerald-500 to-teal-700' },
  { id: 'c5', name: 'NAKI Autopeças', handle: 'nakiautopecas', color: 'from-red-600 to-red-800' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [clients] = useState(INITIAL_CLIENTS);
  const [activeClientId, setActiveClientId] = useState(clients[0].id);
  const [posts, setPosts] = useState([]);
  
  const [activeTab, setActiveTab] = useState('todos');
  const [activePlatformFilter, setActivePlatformFilter] = useState('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedType, setCopiedType] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [uploadError, setUploadError] = useState('');
  
  const [formState, setFormState] = useState({
    content: '', platforms: [], hashtags: '', postType: 'estatico',
    media: null, author: 'Equipa Social', scheduleDate: '', scheduleTime: ''
  });
  
  const [previewPost, setPreviewPost] = useState(null);
  const [previewPlatform, setPreviewPlatform] = useState('instagram');

  const fileInputRef = useRef(null);
  const currentClient = clients.find(c => c.id === activeClientId);

  // 1. Iniciar Autenticação Anónima
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Erro auth:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Carregar Posts do Firestore
  useEffect(() => {
    if (!user) return;

    const postsRef = collection(db, 'agencias', 'aoki', 'posts');
    const unsubscribe = onSnapshot(postsRef, (snapshot) => {
      const loadedPosts = [];
      snapshot.forEach(doc => {
        loadedPosts.push({ id: doc.id, ...doc.data() });
      });
      loadedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosts(loadedPosts);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao carregar posts:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Atualizar preview
  useEffect(() => {
    const clientPosts = posts.filter(p => p.clientId === activeClientId);
    if (!previewPost || previewPost.clientId !== activeClientId || !clientPosts.find(p => p.id === previewPost.id)) {
      setPreviewPost(clientPosts[0] || null);
      if (clientPosts[0]) setPreviewPlatform(clientPosts[0].platforms[0]);
    } else {
      const updated = clientPosts.find(p => p.id === previewPost.id);
      if (updated) setPreviewPost(updated);
    }
  }, [activeClientId, posts]);

  const filteredPosts = posts.filter(post => {
    if (post.clientId !== activeClientId) return false;
    const statusMatch = activeTab === 'todos' || post.status === activeTab;
    const platformMatch = activePlatformFilter === 'todas' || post.platforms.includes(activePlatformFilter);
    return statusMatch && platformMatch;
  });

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    setUploadError('');
    if (file) {
      if (file.size > 5000000) {
        setUploadError('Ficheiro muito grande (Máx 5mb para este protótipo).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        setFormState({ ...formState, media: { type, url: reader.result } });
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setEditingId(null); setUploadError('');
    setFormState({ 
      content: '', platforms: [], hashtags: '', postType: 'estatico', 
      media: null, author: 'Equipa Social', scheduleDate: '', scheduleTime: '' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (e, post) => {
    e.stopPropagation(); setEditingId(post.id); setUploadError('');
    setFormState({
      content: post.content, platforms: post.platforms, hashtags: post.hashtags,
      postType: post.postType, media: post.media, author: post.author,
      scheduleDate: post.scheduleDate || '', scheduleTime: post.scheduleTime || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.content.trim() || formState.platforms.length === 0 || !user) return;

    const postsRef = collection(db, 'agencias', 'aoki', 'posts');
    try {
      if (editingId) {
        const postDoc = doc(postsRef, editingId.toString());
        await setDoc(postDoc, { ...formState, status: 'pendente', feedback: '' }, { merge: true });
      } else {
        const newId = Date.now().toString();
        const postDoc = doc(postsRef, newId);
        await setDoc(postDoc, { ...formState, clientId: activeClientId, status: 'pendente', date: new Date().toISOString(), feedback: '' });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setUploadError("Erro ao guardar.");
    }
  };

  const handleRejectClick = (e, id) => {
    e.stopPropagation(); setRejectingId(id); setRejectReason(''); setRejectModalOpen(true);
  };

  const confirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim() || !user || !rejectingId) return;
    try {
      const postDoc = doc(db, 'agencias', 'aoki', 'posts', rejectingId.toString());
      await setDoc(postDoc, { status: 'rejeitado', feedback: rejectReason }, { merge: true });
      setRejectModalOpen(false); setRejectingId(null);
    } catch (error) {}
  };

  const updateStatus = async (id, newStatus) => {
    if (!user) return;
    try {
      const postDoc = doc(db, 'agencias', 'aoki', 'posts', id.toString());
      await setDoc(postDoc, { status: newStatus, feedback: newStatus === 'aprovado' ? '' : undefined }, { merge: true });
    } catch (error) {}
  };

  const deletePost = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'agencias', 'aoki', 'posts', id.toString()));
    } catch (error) {}
  };

  const togglePlatform = (plt) => {
    setFormState(prev => ({ ...prev, platforms: prev.platforms.includes(plt) ? prev.platforms.filter(p => p !== plt) : [...prev.platforms, plt] }));
  };

  const copyToClipboard = (text, type) => {
    const textArea = document.createElement("textarea"); textArea.value = text; document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea);
    setCopiedType(type); setTimeout(() => setCopiedType(null), 2000);
  };

  const formatScheduleDate = (dateString, timeString) => {
    if (!dateString) return "Imediato";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year} às ${timeString || '00:00'}`;
  };

  const getPlatformIcon = (platform, size = "w-5 h-5") => {
    switch (platform) {
      case 'instagram': return <Instagram className={`${size} text-pink-600`} />;
      case 'facebook': return <Facebook className={`${size} text-blue-600`} />;
      case 'linkedin': return <Linkedin className={`${size} text-blue-700`} />;
      default: return null;
    }
  };

  const getPostTypeLabel = (type) => {
    switch (type) {
      case 'carrossel': return { label: 'Carrossel', icon: <Layers className="w-3 h-3" /> };
      case 'reel': return { label: 'Reel', icon: <Film className="w-3 h-3" /> };
      default: return { label: 'Estático', icon: <Square className="w-3 h-3" /> };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-black text-slate-800">A ligar à Cloud do Grupo Aoki...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 h-screen sticky top-0 overflow-y-auto">
        <div className="flex items-center gap-2 font-black text-2xl text-indigo-600">
          <Send className="w-7 h-7" />
          <span>SocialFlow</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Briefcase className="w-3 h-3" /> Cliente Atual
          </p>
          <select 
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer"
            value={activeClientId}
            onChange={(e) => setActiveClientId(e.target.value)}
          >
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <nav className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4">Status</p>
          {[
            { id: 'todos', label: 'Todos', icon: <Eye className="w-4 h-4" /> },
            { id: 'pendente', label: 'Pendentes', icon: <Clock className="w-4 h-4" /> },
            { id: 'aprovado', label: 'Aprovados', icon: <CheckCircle2 className="w-4 h-4" /> },
            { id: 'rejeitado', label: 'Rejeitados', icon: <XCircle className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === tab.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <button
          onClick={openCreateModal}
          className="mt-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100"
        >
          <Plus className="w-5 h-5" /> Post para {currentClient?.name.split(' ')[0]}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800">{currentClient?.name}</h1>
            <p className="text-slate-500 text-sm">Gere as aprovações e rascunhos em tempo real.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 bg-white border border-slate-200 px-4 py-2 rounded-full">
            <Globe className="w-3 h-3 text-indigo-500" />
            Nuvem ({filteredPosts.length})
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* List of Posts */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
                <ImageIcon className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Nenhum post planeado.</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <div 
                  key={post.id}
                  onClick={() => { setPreviewPost(post); setPreviewPlatform(post.platforms[0]); }}
                  className={`group bg-white p-6 rounded-[2rem] border transition-all cursor-pointer hover:shadow-xl ${
                    previewPost?.id === post.id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-2">
                      {post.platforms.map(plt => (
                        <div key={plt} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          {getPlatformIcon(plt, "w-4 h-4")}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2 items-center">
                        <span className="flex items-center gap-1.5 text-[10px] bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg font-black uppercase">
                          {getPostTypeLabel(post.postType).icon} {getPostTypeLabel(post.postType).label}
                        </span>
                        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 ${
                          post.status === 'aprovado' ? 'bg-green-50 text-green-600' : 
                          post.status === 'rejeitado' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {post.status}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatScheduleDate(post.scheduleDate, post.scheduleTime)}
                      </span>
                    </div>
                  </div>
                  
                  {post.status === 'rejeitado' && post.feedback && (
                    <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-red-800 uppercase tracking-wider mb-1">Motivo da Rejeição</p>
                        <p className="text-sm text-red-600 leading-relaxed">{post.feedback}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-5">
                    {post.media ? (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 relative">
                        {post.media.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900"><Film className="w-8 h-8 text-white opacity-40" /></div>
                        ) : (<img src={post.media.url} className="w-full h-full object-cover" />)}
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-slate-50 shrink-0 border border-slate-100 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-slate-300" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 text-sm line-clamp-3 leading-relaxed mb-2 whitespace-pre-wrap">{post.content}</p>
                      <p className="text-indigo-500 text-xs font-bold truncate">{post.hashtags}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-5 mt-5 border-t border-slate-50">
                    <div className="flex gap-2">
                      {post.status === 'pendente' ? (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(post.id, 'aprovado'); }} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> Aprovar</button>
                          <button onClick={(e) => handleRejectClick(e, post.id)} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 text-xs font-bold"><XCircle className="w-4 h-4" /> Rejeitar</button>
                        </>
                      ) : post.status === 'aprovado' ? (
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"><Send className="w-3.5 h-3.5" /> Aprovado</button>
                      ) : null}
                      <button onClick={(e) => openEditModal(e, post)} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Por {post.author}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Preview Area (Smartphone) */}
          <div className="lg:sticky lg:top-8 h-fit space-y-6">
            {previewPost && (
              <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 justify-center shadow-sm">
                {previewPost.platforms.map(plt => (
                  <button key={plt} onClick={() => setPreviewPlatform(plt)} className={`px-5 py-2.5 rounded-xl text-xs font-black capitalize transition-all flex items-center gap-2 ${previewPlatform === plt ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'}`}>
                    {getPlatformIcon(plt, "w-4 h-4")} {plt}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-slate-900 rounded-[3.5rem] p-4 shadow-2xl relative border-[10px] border-slate-800 mx-auto max-w-[340px]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-[1.5rem] z-10 flex items-center justify-center"><div className="w-12 h-1 bg-slate-700 rounded-full"></div></div>
              
              <div className="bg-white rounded-[2.5rem] h-[580px] overflow-hidden flex flex-col relative shadow-inner">
                <div className="p-5 border-b border-slate-50 flex items-center justify-between mt-5">
                  <Smartphone className="w-4 h-4 text-slate-200" />
                  <span className="text-[9px] font-black text-slate-300 tracking-[0.2em] uppercase">{previewPlatform} FEED</span>
                  <div className="w-4" />
                </div>

                {previewPost ? (
                  <div className="flex-1 overflow-y-auto bg-slate-50 pb-24">
                    {/* LINKEDIN */}
                    {previewPlatform === 'linkedin' && (
                      <div className="bg-white m-2 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-3 flex items-start justify-between">
                          <div className="flex gap-2">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-sm">{currentClient?.name.charAt(0)}</div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">{currentClient?.name}</p>
                              <p className="text-[9px] text-slate-400">{previewPost.scheduleDate ? formatScheduleDate(previewPost.scheduleDate, previewPost.scheduleTime) : 'agora'} • 🌐</p>
                            </div>
                          </div>
                        </div>
                        <div className="px-3 pb-3">
                          <p className="text-[11px] text-slate-800 whitespace-pre-wrap">{previewPost.content}</p>
                          <p className="text-[11px] text-indigo-700 font-bold mt-2">{previewPost.hashtags}</p>
                        </div>
                        {previewPost.media && (
                          <div className="bg-slate-100 aspect-video flex items-center justify-center border-y border-slate-50">
                             {previewPost.media.type === 'video' ? <Film className="w-8 h-8 text-slate-300" /> : <img src={previewPost.media.url} className="w-full h-full object-cover" />}
                          </div>
                        )}
                      </div>
                    )}

                    {/* INSTAGRAM */}
                    {previewPlatform === 'instagram' && (
                      <div className="bg-white min-h-full">
                        <div className="p-3 flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentClient?.color} p-[1.5px]`}>
                            <div className="w-full h-full rounded-full bg-white border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-300">{currentClient?.name.charAt(0)}</div>
                          </div>
                          <span className="text-[12px] font-black">{currentClient?.handle}</span>
                        </div>
                        
                        <div className="relative">
                          {previewPost.media ? (
                            <div className={`aspect-square bg-slate-100 overflow-hidden ${previewPost.postType === 'reel' ? 'brightness-75' : ''}`}>
                               {previewPost.postType === 'reel' ? (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-900"><Film className="w-12 h-12 text-white/40" /></div>
                               ) : (<img src={previewPost.media.url} className="w-full h-full object-cover shadow-inner" />)}
                            </div>
                          ) : (<div className="aspect-square bg-slate-50 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-slate-200" /></div>)}
                        </div>

                        <div className="p-4 space-y-2">
                          <p className="text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                            <span className="font-black mr-1.5">{currentClient?.handle}</span>{previewPost.content}
                          </p>
                          <p className="text-[12px] text-indigo-700 font-bold">{previewPost.hashtags}</p>
                        </div>
                      </div>
                    )}

                    {/* FACEBOOK */}
                    {previewPlatform === 'facebook' && (
                      <div className="bg-white m-3 rounded-xl shadow-md border border-slate-100">
                        <div className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xl">{currentClient?.name.charAt(0)}</div>
                          <div>
                            <p className="text-[13px] font-black text-slate-900">{currentClient?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{previewPost.scheduleDate ? formatScheduleDate(previewPost.scheduleDate, previewPost.scheduleTime) : 'agora'}</p>
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          <p className="text-[12px] text-slate-800 whitespace-pre-wrap">{previewPost.content}</p>
                          <p className="text-[12px] text-indigo-600 font-bold mt-2">{previewPost.hashtags}</p>
                        </div>
                        {previewPost.media && <div className="bg-slate-100 border-y border-slate-50"><img src={previewPost.media.url} className="w-full h-auto" /></div>}
                      </div>
                    )}

                    {/* Quick Action Overlay */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%] space-y-2.5">
                      <button onClick={() => copyToClipboard(previewPost.content, 'content')} className="w-full bg-white/95 backdrop-blur-xl border border-slate-200 py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 shadow-2xl hover:bg-white transition-all">
                        {copiedType === 'content' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />} {copiedType === 'content' ? 'COPIADO!' : 'COPIAR LEGENDA'}
                      </button>
                      <button onClick={() => copyToClipboard(previewPost.hashtags, 'hashtags')} className="w-full bg-white/95 backdrop-blur-xl border border-slate-200 py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 shadow-2xl hover:bg-white transition-all">
                        {copiedType === 'hashtags' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Hash className="w-3.5 h-3.5 text-indigo-600" />} {copiedType === 'hashtags' ? 'COPIADAS!' : 'COPIAR HASHTAGS'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-300">
                    <Smartphone className="w-16 h-16 mb-6 opacity-10" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40 leading-loose">Selecione um rascunho</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal - Novo/Editar Post */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-xl z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{editingId ? 'Editar Publicação' : 'Nova Publicação'}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">Para <span className="text-indigo-500 font-black">{currentClient?.name}</span></p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900"><XCircle className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Redes Sociais</label>
                  <div className="flex gap-3">
                    {['instagram', 'facebook', 'linkedin'].map(plt => (
                      <button key={plt} type="button" onClick={() => togglePlatform(plt)} className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formState.platforms.includes(plt) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>
                        {getPlatformIcon(plt, "w-7 h-7")} <span className="text-[10px] font-black capitalize">{plt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Upload</label>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" />
                  <div onClick={() => fileInputRef.current.click()} className={`aspect-video bg-slate-50 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative ${uploadError ? 'border-red-400' : 'border-slate-200'}`}>
                    {formState.media ? (
                      <>
                        {formState.media.type === 'image' ? <img src={formState.media.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-900"><Film className="w-10 h-10 text-white" /></div>}
                      </>
                    ) : (
                      <>
                        <div className="p-5 bg-white rounded-3xl shadow-sm mb-4"><Plus className="w-7 h-7 text-indigo-600" /></div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center px-4">Foto ou Vídeo<br/><span className="text-[8px] font-medium opacity-70">(Máx. 800KB)</span></p>
                      </>
                    )}
                  </div>
                  {uploadError && <p className="text-red-500 text-[10px] font-bold mt-2">{uploadError}</p>}
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Legenda</label>
                  <textarea required rows={6} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium outline-none resize-none" value={formState.content} onChange={(e) => setFormState({...formState, content: e.target.value})}></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2"><Hash className="w-4 h-4 text-indigo-500" /> Hashtags</label>
                  <input type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={formState.hashtags} onChange={(e) => setFormState({...formState, hashtags: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="submit" disabled={formState.platforms.length === 0} className={`flex-1 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${formState.platforms.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white shadow-xl'}`}>
                    {editingId ? 'Guardar' : 'Enviar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Motivo de Rejeição */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 mb-6">Rejeitar Publicação</h3>
            <form onSubmit={confirmReject}>
              <textarea required rows={4} placeholder="Motivo da rejeição..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none mb-6" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}></textarea>
              <div className="flex gap-3">
                <button type="button" onClick={() => setRejectModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm">Confirmar Rejeição</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}