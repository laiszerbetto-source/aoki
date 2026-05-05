import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  CheckCircle2, XCircle, Clock, Send, Instagram, Facebook, Linkedin, 
  Plus, Trash2, Smartphone, Eye, Copy, Image as ImageIcon, Film, 
  Hash, Check, Layers, Square, ThumbsUp, MessageSquare, Share2, Edit3, Globe, Calendar, AlertCircle, Briefcase, Loader2, Share
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [copiedType, setCopiedType] = useState(null);
  
  // ✨ NOVO: Estado para verificar se é a visão do cliente
  const [isClientView, setIsClientView] = useState(false);

  const [formState, setFormState] = useState({
    content: '', platforms: [], hashtags: '', postType: 'estatico',
    media: null, scheduleDate: '', scheduleTime: ''
  });
  
  const [previewPost, setPreviewPost] = useState(null);
  const [previewPlatform, setPreviewPlatform] = useState('instagram');

  const fileInputRef = useRef(null);
  const currentClient = INITIAL_CLIENTS.find(c => c.id === activeClientId);

  // ✨ NOVO: Verificar se existe ?view=client na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') {
      setIsClientView(true);
    }
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
    const clientPosts = posts.filter(p => p.clientId === activeClientId);
    if (!previewPost || previewPost.clientId !== activeClientId) {
      setPreviewPost(clientPosts[0] || null);
      if (clientPosts[0]) setPreviewPlatform(clientPosts[0].platforms[0]);
    }
  }, [activeClientId, posts]);

  const filteredPosts = posts.filter(p => p.clientId === activeClientId && (activeTab === 'todos' || p.status === activeTab));

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
        clientId: activeClientId,
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

  // ✨ NOVO: Função para gerar link do cliente
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

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse text-xl">Sincronizando Aoki Flow...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900 antialiased">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 h-screen sticky top-0 overflow-y-auto z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-2xl text-white"><Send size={24} /></div>
          <span className="font-black text-2xl tracking-tighter">SocialFlow</span>
        </div>

        {isClientView && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <Eye size={12} /> Modo de Aprovação
            </p>
            <p className="text-[11px] text-amber-700 font-medium mt-1 leading-tight">Você está visualizando os posts pendentes para aprovação.</p>
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={12} /> Marca Aoki</p>
          <select 
            className="w-full bg-white border border-slate-200 text-sm font-bold rounded-xl px-4 py-3 outline-none cursor-pointer"
            value={activeClientId}
            onChange={(e) => setActiveClientId(e.target.value)}
          >
            {INITIAL_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <nav className="space-y-1">
          {[
            { id: 'todos', label: 'Todos os Posts', icon: <Eye size={18} /> },
            { id: 'pendente', label: 'Pendentes', icon: <Clock size={18} className="text-amber-500" /> },
            { id: 'aprovado', label: 'Aprovados', icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
            { id: 'rejeitado', label: 'Rejeitados', icon: <XCircle size={18} className="text-rose-500" /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white font-bold shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          {/* ✨ Botão de Partilha exclusivo para Admin */}
          {!isClientView && (
            <button
              onClick={copyClientLink}
              className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-xs"
            >
              <Share size={16} /> Link p/ Cliente
            </button>
          )}

          {/* Botão Novo Conteúdo (Escondido para cliente) */}
          {!isClientView && (
            <button
              onClick={() => { setEditingId(null); setFormState({ content: '', platforms: [], hashtags: '', postType: 'estatico', media: null, scheduleDate: '', scheduleTime: '' }); setIsModalOpen(true); }}
              className="w-full bg-slate-900 text-white py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-xl"
            >
              <Plus size={20} /> Novo Conteúdo
            </button>
          )}
        </div>
      </aside>

      {/* Feed Principal */}
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${currentClient?.color}`} />
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentClient?.name}</h2>
            </div>
            <p className="text-slate-400 text-sm font-medium italic">
              {isClientView ? 'Central de Aprovação do Cliente' : 'Rascunhos e aprovações'}
            </p>
          </div>
          <div className="bg-white border border-slate-200 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Globe size={12} className="text-indigo-500" /> Itens: {filteredPosts.length}
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-10">
          {/* Coluna da Esquerda: Feed */}
          <div className="space-y-6">
            {filteredPosts.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center flex flex-col items-center">
                <ImageIcon className="text-slate-200 w-12 h-12 mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sem rascunhos</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <div 
                  key={post.id}
                  onClick={() => { setPreviewPost(post); setPreviewPlatform(post.platforms[0]); }}
                  className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer hover:shadow-2xl ${previewPost?.id === post.id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 shadow-sm'}`}
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
                    <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-slate-100 shrink-0 border border-slate-100 relative shadow-inner">
                      {post.media ? (post.media.type === 'video' ? <div className="w-full h-full flex items-center justify-center bg-slate-900"><Film className="text-white/30" /></div> : <img src={post.media.url} className="w-full h-full object-cover" />) : <ImageIcon size={24} className="text-slate-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 text-sm font-medium leading-relaxed line-clamp-3 mb-3 whitespace-pre-wrap">{post.content}</p>
                      <p className="text-indigo-600 text-[11px] font-black tracking-tight truncate">{post.hashtags}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-50">
                    <div className="flex gap-3">
                      {/* Controlos Administrativos (Escondidos para cliente) */}
                      {!isClientView && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(post.id); setFormState({...post}); setIsModalOpen(true); }} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 border border-slate-100 transition-all"><Edit3 size={18} /></button>
                          <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:text-rose-600 border border-slate-100 transition-all"><Trash2 size={18} /></button>
                        </>
                      )}
                      
                      {/* Rejeitar (Disponível para ambos se estiver pendente) */}
                      {post.status === 'pendente' && (
                        <button onClick={(e) => { e.stopPropagation(); if(confirm("Deseja rejeitar este post?")) setDoc(doc(db, 'agencias', 'aoki', 'posts', post.id), { status: 'rejeitado' }, { merge: true }); }} className="bg-slate-50 text-rose-500 px-5 py-2.5 rounded-xl text-xs font-black border border-rose-100 hover:bg-rose-50 transition-all">Rejeitar</button>
                      )}
                    </div>
                    
                    {/* Aprovar (Disponível para ambos se estiver pendente) */}
                    {post.status === 'pendente' && (
                      <button onClick={(e) => { e.stopPropagation(); setDoc(doc(db, 'agencias', 'aoki', 'posts', post.id), { status: 'aprovado' }, { merge: true }); }} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-50 hover:bg-emerald-600 transition-all">Aprovar Postagem</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Coluna da Direita: Smartphone Preview */}
          <div className="hidden xl:block sticky top-10 space-y-6">
            {previewPost && (
              <div className="flex gap-1.5 bg-white p-2 rounded-[1.5rem] border border-slate-200 shadow-sm">
                {previewPost.platforms.map(plt => (
                  <button key={plt} onClick={() => setPreviewPlatform(plt)} className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all ${previewPlatform === plt ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
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
                    <div className="bg-white px-5 py-4 border-b border-slate-50 flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{previewPlatform} preview</span>
                       <Smartphone size={14} className="text-slate-200" />
                    </div>

                    {previewPlatform === 'instagram' && (
                      <div className="bg-white animate-in fade-in">
                        <div className="p-3.5 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${currentClient?.color} p-[1.5px]`}>
                            <div className="w-full h-full rounded-full bg-white border-2 border-white flex items-center justify-center font-black text-slate-300 text-[10px]">{currentClient?.name.charAt(0)}</div>
                          </div>
                          <span className="text-[13px] font-black tracking-tight">{currentClient?.handle}</span>
                        </div>
                        <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                          {previewPost.media ? <img src={previewPost.media.url} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-slate-100" />}
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex gap-4 mb-2"><ThumbsUp size={22} /><MessageSquare size={22} /><Send size={22} /></div>
                          <p className="text-[12.5px] leading-relaxed"><span className="font-black mr-2">{currentClient?.handle}</span>{previewPost.content}</p>
                          <p className="text-[12.5px] text-indigo-600 font-bold">{previewPost.hashtags}</p>
                        </div>
                      </div>
                    )}

                    {previewPlatform === 'linkedin' && (
                      <div className="bg-white m-3 rounded-xl border border-slate-100 shadow-sm p-4">
                        <div className="flex gap-3 mb-4">
                          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl">{currentClient?.name.charAt(0)}</div>
                          <div><p className="text-[13px] font-bold text-slate-900">{currentClient?.name}</p><p className="text-[10px] text-slate-400 mt-1 font-medium">Post agendado • <Globe size={10} className="inline ml-1" /></p></div>
                        </div>
                        <p className="text-[12.5px] text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">{previewPost.content}</p>
                        {previewPost.media && <img src={previewPost.media.url} className="w-full rounded-xl border border-slate-50 mb-4" />}
                        <div className="flex justify-between border-t border-slate-50 pt-4 text-slate-400 px-2"><ThumbsUp size={18} /><MessageSquare size={18} /><Share2 size={18} /></div>
                      </div>
                    )}

                    {previewPlatform === 'facebook' && (
                      <div className="bg-white m-3 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center gap-3">
                          <div className="w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xl">{currentClient?.name.charAt(0)}</div>
                          <div><p className="text-[14px] font-black text-slate-900 leading-none">{currentClient?.name}</p><p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase">Agora • <Globe size={10} /></p></div>
                        </div>
                        <p className="px-4 pb-4 text-[13.5px] text-slate-800 leading-relaxed">{previewPost.content}</p>
                        {previewPost.media && <img src={previewPost.media.url} className="w-full h-auto border-y border-slate-50" />}
                        <div className="p-3 flex justify-around text-slate-400 font-black border-t border-slate-50"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wider"><ThumbsUp size={16} /> Gostar</div><div className="flex items-center gap-2 text-[11px] uppercase tracking-wider"><MessageSquare size={16} /> Comentar</div></div>
                      </div>
                    )}

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%] space-y-2.5">
                      <button onClick={() => copyToClipboard(previewPost.content, 'content')} className="w-full bg-white/95 backdrop-blur-xl border border-slate-200 py-3.5 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all">
                        {copiedType === 'content' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-indigo-600" />} {copiedType === 'content' ? 'Copiado!' : 'Copiar Legenda'}
                      </button>
                      <button onClick={() => copyToClipboard(previewPost.hashtags, 'hashtags')} className="w-full bg-white/95 backdrop-blur-xl border border-slate-200 py-3.5 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all">
                        {copiedType === 'hashtags' ? <Check size={16} className="text-emerald-500" /> : <Hash size={16} className="text-indigo-600" />} {copiedType === 'hashtags' ? 'Tags Copiadas!' : 'Copiar Hashtags'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-200 opacity-20"><Smartphone size={48} className="mb-4" /><p className="text-[10px] font-black uppercase tracking-widest leading-loose">Selecione um rascunho</p></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Novo/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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
                      {formState.media ? <img src={formState.media.url} className="w-full h-full object-cover shadow-2xl" /> : (
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
                    <textarea required rows={5} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium outline-none transition-all resize-none leading-relaxed" value={formState.content} onChange={(e) => setFormState({...formState, content: e.target.value})} placeholder="Escreve aqui..."></textarea>
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
