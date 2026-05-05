import React, { useState, useEffect } from 'react';
import { db, storage } from './src/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Calendar, Image as ImageIcon, CheckCircle, X } from 'lucide-react';

interface Post {
  id: string;
  texto: string;
  imageUrl?: string;
  dataPost?: string;
  createdAt: any;
}

export default function App() {
  // Estados do Sistema
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [texto, setTexto] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Carregar posts ao iniciar
  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
    }
  }

  // Lidar com a seleção da imagem e validação de tamanho (3MB)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');
    
    if (file) {
      if (file.size > 3000000) { // 3MB em bytes
        setUploadError('Ficheiro muito grande (Máx 3MB para este protótipo).');
        setImage(null);
        return;
      }
      setImage(file);
    }
  };

  // Guardar o Post no Firebase
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto && !image) return;

    setLoading(true);
    try {
      let url = '';

      // Se houver imagem, faz o upload para o Storage
      if (image) {
        const imageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
        const snapshot = await uploadBytes(imageRef, image);
        url = await getDownloadURL(snapshot.ref);
      }

      // Salva os dados no Firestore (incluindo a nova data de agendamento)
      await addDoc(collection(db, 'posts'), {
        texto: texto,
        imageUrl: url,
        dataPost: dataAgendamento,
        createdAt: new Date()
      });

      // Recarrega a lista de posts
      await fetchPosts();

      // Limpa os campos e fecha a tela automaticamente
      setTexto('');
      setImage(null);
      setDataAgendamento('');
      setIsModalOpen(false);

    } catch (error) {
      console.error("Erro ao guardar o post:", error);
      alert("Houve um erro ao guardar o seu post. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">AOKI</h1>
          <p className="text-xs text-gray-500">Gestão de Conteúdo & Cronograma</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} /> Novo Post
        </button>
      </header>

      {/* Conteúdo Principal / Feed */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Calendar size={20} className="text-purple-600" /> Feed de Publicações
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8">
            <p className="text-gray-500">Nenhum post agendado ainda. Comece criando um!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                {post.imageUrl && (
                  <div className="aspect-square w-full bg-gray-100 overflow-hidden">
                    <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.texto}</p>
                  
                  {/* Informações de Data e Status */}
                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
                    {post.dataPost ? (
                      <div className="text-xs text-purple-600 font-medium flex items-center gap-1">
                        <Calendar size={12} /> Agendado: {new Date(post.dataPost).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={12} /> Sem data definida
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Janela Modal de Novo Post */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Criar Nova Publicação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Campo de Texto */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legenda do Post</label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escreva a legenda ou notas sobre este post..."
                  className="w-full min-h-[100px] border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Campo de Data e Hora do Agendamento */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data e Hora da Publicação</label>
                <input
                  type="datetime-local"
                  value={dataAgendamento}
                  onChange={(e) => setDataAgendamento(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Campo de Upload de Imagem */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mídia do Post</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2 bg-purple-50 rounded-full text-purple-600">
                      <ImageIcon size={20} />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {image ? image.name : 'Clique para carregar foto'}
                    </p>
                    <p className="text-xs text-gray-400">Máx. 3MB por arquivo</p>
                  </div>
                </div>

                {/* Mensagem de Erro de Upload */}
                {uploadError && (
                  <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                    ⚠️ {uploadError}
                  </p>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || (!texto && !image)}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  {loading ? 'A guardar...' : 'Guardar Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
