{/* NOVO LAYOUT DE CARD SEM ESPAÇOS EM BRANCO */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full items-start">
  {filteredPosts.map(post => (
    <div key={post.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col group">
      
      {/* 1. TOPO: MÍDIA (OCUPA A LARGURA TODA) */}
      <div className="aspect-square w-full bg-slate-50 relative border-b border-slate-50">
        <MediaCarousel media={post.media} />
        
        {/* BADGES FLUTUANTES SOBRE A IMAGEM */}
        <div className="absolute top-4 left-4 flex gap-2">
          {post.platforms.map(plt => (
            <div key={plt} className="p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-sm text-indigo-600 border border-white">
              {plt === 'instagram' && <Instagram size={14} />}
              {plt === 'facebook' && <Facebook size={14} />}
              {plt === 'linkedin' && <Linkedin size={14} />}
            </div>
          ))}
        </div>
        <div className="absolute top-4 right-4 capitalize">
          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black backdrop-blur-md shadow-sm border ${
            post.status === 'aprovado' ? 'bg-emerald-500/90 text-white border-emerald-400' : 
            post.status === 'rejeitado' ? 'bg-rose-500/90 text-white border-rose-400' : 
            'bg-amber-400/90 text-white border-amber-300'
          }`}>{post.status}</span>
        </div>
      </div>

      {/* 2. MEIO: CONTEÚDO (PREENCHIMENTO HARMONIOSO) */}
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-indigo-600/50 bg-indigo-50/50 w-fit px-3 py-1.5 rounded-full border border-indigo-100/50">
          <Calendar size={14} />
          <span className="text-[10px] font-black uppercase tracking-tight">
            {post.scheduleDate?.split('-').reverse().join('/')} às {post.scheduleTime}
          </span>
        </div>

        <p className="text-slate-700 text-sm font-medium leading-relaxed mb-4 whitespace-pre-wrap flex-1 italic">
          "{post.content}"
        </p>
        
        {post.hashtags && (
          <p className="text-indigo-500 text-[11px] font-black mb-6">
            {post.hashtags}
          </p>
        )}

        {/* 3. BASE: FERRAMENTAS E AÇÕES */}
        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => setZoomedPost(post)} className="p-2 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"><Maximize2 size={18} /></button>
            <button onClick={() => setFeedbackPost(post)} className="p-2 bg-slate-50 text-indigo-500 rounded-xl hover:bg-indigo-100 relative transition-colors">
              <MessageSquare size={18} />
              {post.feedbacks?.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>}
            </button>
            {!isClientView && <button onClick={() => { setEditingId(post.id); setFormState({...post}); setIsModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 transition-colors"><Edit3 size={18} /></button>}
          </div>

          <div className="flex gap-2">
            {post.status !== 'aprovado' && (
              <button onClick={() => changeStatus(post.id, 'aprovado')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-[1.2rem] text-[10px] font-black shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest">Aprovar</button>
            )}
            {post.status === 'pendente' && (
              <button onClick={() => changeStatus(post.id, 'rejeitado')} className="bg-slate-50 text-rose-500 px-5 py-2.5 rounded-[1.2rem] text-[10px] font-black border border-rose-100 hover:bg-rose-50 transition-all uppercase tracking-widest">Rejeitar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
