"use client";

import React, { useState, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Plus, Edit, Trash2, X, AlertCircle, UploadCloud } from "lucide-react";

// --- TIPOS DE DADOS ---
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

// --- SUB-COMPONENTE: GESTÃO DE PRODUTOS ---
const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentThread, setCurrentThread] = useState<Product | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setProducts(productsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
      await deleteDoc(doc(db, "products", id));
    }
  };

  return (
    <>
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
      {isModalOpen && (
        <ProductModal product={currentThread} onClose={closeModal} />
      )}
    </>
  );
};

// --- SUB-COMPONENTE: GESTÃO DA CONTA ---
const AccountManagement = ({ user }: { user: User }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");

  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState({ email: false, password: false });

  const handleMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const reauthenticate = async (password: string) => {
    if (!user.email) throw new Error("Usuário sem e-mail.");
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      handleMessage("error", "As novas senhas não coincidem.");
      return;
    }
    setLoading((prev) => ({ ...prev, password: true }));
    try {
      await reauthenticate(currentPassword);
      await updatePassword(user, newPassword);
      handleMessage("success", "Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      handleMessage(
        "error",
        "Falha ao alterar senha. Verifique sua senha atual."
      );
    } finally {
      setLoading((prev) => ({ ...prev, password: false }));
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, email: true }));
    try {
      await reauthenticate(emailCurrentPassword);
      await updateEmail(user, newEmail);
      handleMessage(
        "success",
        "E-mail alterado com sucesso! Você precisará fazer login novamente."
      );
      setTimeout(() => signOut(auth), 3000);
    } catch (error) {
      handleMessage("error", "Falha ao alterar o e-mail. Verifique sua senha.");
    } finally {
      setLoading((prev) => ({ ...prev, email: false }));
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Minha Conta</h2>
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Alterar Senha</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Senha Atual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nova Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div className="text-right">
              <button
                type="submit"
                disabled={loading.password}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 disabled:bg-primary/50"
              >
                {loading.password ? "Alterando..." : "Alterar Senha"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Alterar E-mail</h3>
          <p className="text-sm text-gray-500 mb-4">
            Após alterar seu e-mail, você será desconectado e precisará fazer
            login com o novo endereço.
          </p>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Novo E-mail
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Senha Atual (para confirmação)
              </label>
              <input
                type="password"
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div className="text-right">
              <button
                type="submit"
                disabled={loading.email}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary/90 disabled:bg-primary/50"
              >
                {loading.email ? "Alterando..." : "Alterar E-mail"}
              </button>
            </div>
          </form>
        </div>
        {message.text && (
          <div
            className={`p-4 rounded-md flex items-center ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <AlertCircle size={20} className="mr-3" />
            {message.text}
          </div>
        )}
      </div>
    </>
  );
};

// --- COMPONENTE DO PAINEL DE CONTROLE (DASHBOARD) ---
const AdminDashboard = ({ user }: { user: User }) => {
  const [activeTab, setActiveTab] = useState("products");
  const handleLogout = async () => {
    await signOut(auth);
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
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("products")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "products"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Gerenciar Produtos
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "account"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Minha Conta
            </button>
          </nav>
        </div>
        <div>
          {activeTab === "products" && <ProductManagement />}
          {activeTab === "account" && <AccountManagement user={user} />}
        </div>
      </main>
    </div>
  );
};

// --- COMPONENTE DO MODAL PARA ADICIONAR/EDITAR PRODUTO (COM UPLOAD) ---
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed", error);
        setUploadProgress(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImage(downloadURL);
          setUploadProgress(null);
        });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      alert("Por favor, carregue uma imagem para o produto.");
      return;
    }
    const productData = { name, description, price: Number(price), image };

    if (product) {
      await updateDoc(doc(db, "products", product.id), productData);
    } else {
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
            <label className="block text-sm font-medium text-gray-700">
              Imagem do Produto
            </label>
            <div className="mt-1 flex items-center space-x-4">
              {image && (
                <img
                  src={image}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-md"
                />
              )}
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50"
              >
                <UploadCloud size={16} className="inline-block mr-2" />
                <span>{image ? "Trocar Imagem" : "Selecionar Imagem"}</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </label>
            </div>
            {uploadProgress !== null && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
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
              disabled={uploadProgress !== null}
              className="px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
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
const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Falha no login. Verifique seu e-mail e senha.");
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage(
        "Se um e-mail correspondente for encontrado, um link para redefinir a senha foi enviado."
      );
    } catch (error) {
      setError("Ocorreu um erro ao tentar enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center font-serif text-gray-900">
          {isResetMode ? "Redefinir Senha" : "Amélie Café - Painel"}
        </h1>
        {isResetMode ? (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <p className="text-sm text-center text-gray-600">
              Digite seu e-mail para receber um link de redefinição de senha.
            </p>
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
                className="w-full px-3 py-2 mt-1 border rounded-md"
              />
            </div>
            {resetMessage && (
              <p className="text-sm text-green-600">{resetMessage}</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 font-semibold text-white bg-primary rounded-md hover:bg-primary/90 disabled:bg-primary/50"
              >
                {loading ? "Enviando..." : "Enviar Link"}
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="text-sm text-blue-600 hover:underline"
              >
                Voltar para o login
              </button>
            </div>
          </form>
        ) : (
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
                className="w-full px-3 py-2 mt-1 border rounded-md"
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
                className="w-full px-3 py-2 mt-1 border rounded-md"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setIsResetMode(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Esqueci a senha
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 font-semibold text-white bg-primary rounded-md hover:bg-primary/90 disabled:bg-primary/50"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>
        )}
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
  return user ? <AdminDashboard user={user} /> : <LoginForm />;
}
