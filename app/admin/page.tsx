"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { Plus, Edit, Trash2, X } from "lucide-react";

// --- TIPOS DE DADOS ---
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

// --- COMPONENTE DO PAINEL DE CONTROLE (DASHBOARD) ---
const AdminDashboard = ({ user }: { user: User }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentThread, setCurrentThread] = useState<Product | null>(null);

  // Efeito para buscar os produtos do Firestore em tempo real
  useEffect(() => {
    const productsCollection = collection(db, "products");

    // onSnapshot ouve mudanças no banco de dados automaticamente
    const unsubscribe = onSnapshot(productsCollection, (snapshot) => {
      const productsList = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Product)
      );
      setProducts(productsList);
      setLoading(false);
    });

    // Limpa o ouvinte quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const openModal = (product: Product | null) => {
    setCurrentThread(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentThread(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      const productDoc = doc(db, "products", id);
      await deleteDoc(productDoc);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold font-serif text-gray-800">
            Painel Administrativo
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
          <button
            onClick={() => openModal(null)}
            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2" /> Adicionar Produto
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          {loading ? (
            <p>Carregando produtos...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Produto
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Preço
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                      >
                        {product.name}
                      </th>
                      <td className="px-6 py-4">
                        R$ {product.price.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openModal(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      {isModalOpen && (
        <ProductModal product={currentThread} onClose={closeModal} />
      )}
    </div>
  );
};

// --- COMPONENTE DO MODAL PARA ADICIONAR/EDITAR PRODUTO ---
const ProductModal = ({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) => {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || 0);
  const [image, setImage] = useState(product?.image || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = { name, description, price: Number(price), image };

    if (product) {
      // Editando produto existente
      const productDoc = doc(db, "products", product.id);
      await updateDoc(productDoc, productData);
    } else {
      // Adicionando novo produto
      await addDoc(collection(db, "products"), productData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 font-serif">
          {product ? "Editar Produto" : "Adicionar Novo Produto"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Nome do Produto
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Preço (ex: 42.50)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700"
            >
              URL da Imagem
            </label>
            <input
              id="image"
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary/90"
            >
              {product ? "Salvar Alterações" : "Adicionar Produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE DA TELA DE LOGIN ---
const LoginForm = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError("Falha no login. Verifique seu e-mail e senha.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center font-serif text-gray-900">
          Amélie Café - Painel
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ADMIN ---
export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return user ? (
    <AdminDashboard user={user} />
  ) : (
    <LoginForm onLoginSuccess={() => setLoading(true)} />
  );
}
