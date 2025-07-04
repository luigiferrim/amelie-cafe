"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Menu,
  X,
  Plus,
  Minus,
  MapPin,
  Instagram,
  Facebook,
  MessageSquare,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Image from "next/image";

// --- TIPOS DE DADOS (INTERFACES) ---
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Location {
  name: string;
  hours: string;
  mapUrl: string;
  embedMapUrl: string;
  image: string;
}

// --- DADOS ESTÁTICOS COM OS LINKS CORRIGIDOS ---
const locations: Location[] = [
  {
    name: "Unité Colégio Rosa",
    hours: "Seg/Sex 8:30 às 18h\nSáb até 13h",
    mapUrl: "https://share.google/70y54LP8TQ3Jl9opH",
    embedMapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1806955.5896000508!2d-52.763747634388814!3d-27.803301991340636!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94e01f4dc5b9bfc9%3A0xacaf0eaee379cffc!2zQW3DqWxpZSBDYWbDqSAtIFVuaXTDqSBDb2zDqWdpbyBSb3Nh!5e0!3m2!1spt-BR!2sbr!4v1751648951797!5m2!1spt-BR!2sbr",
    image: "/unidade-rosa.png",
  },
  {
    name: "Unité Frei Gabriel",
    hours: "Seg/Sex 9h às 18h",
    mapUrl: "https://share.google/mrV8EjLcRn4YmiWFK",
    embedMapUrl:
      "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1806666.1396298185!2d-52.7581948!3d-27.8207022!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94e01f8f2b3185cd%3A0x68158e9366f13747!2sAmelie%20Caf%C3%A9%20-%20Unit%C3%A9%20Frei%20Gabriel!5e0!3m2!1spt-BR!2sbr!4v1751648687999!5m2!1spt-BR!2sbr",
    image: "/unidade-gabriel.png",
  },
  {
    name: "Unité Uniplac",
    hours: "Seg/Sex 9h às 21:30",
    mapUrl: "https://share.google/TZw04IfSOKfFrIdZL",
    embedMapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1806955.5896000508!2d-52.763747634388814!3d-27.803301991340636!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94e01f446852250f%3A0x8895b94b0c8aa764!2zQW3DqWxpZSBDYWbDqSAtIFVuaXTDqSBVbmlwbGFj!5e0!3m2!1spt-BR!2sbr!4v1751648989302!5m2!1spt-BR!2sbr",
    image: "/unidade-uniplac.png",
  },
  {
    name: "Unité Clinitrauma",
    hours: "Seg/Sex 8h às 18h",
    mapUrl: "https://share.google/08WRSruahoUwJz7JY",
    embedMapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1806955.5896000508!2d-52.763747634388814!3d-27.803301991340636!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94e01f05dbac8de9%3A0x66a816c5cb6a5b0c!2sAm%C3%A9lie%20Caf%C3%A9%20-%20Unit%C3%A9%20Clini%20Trauma!5e0!3m2!1spt-BR!2sbr!4v1751648965414!5m2!1spt-BR!2sbr",
    image: "/unidade-clinitrauma.png",
  },
];

const testimonials = [
  {
    text: "O melhor café da cidade! O ambiente é super aconchegante e o pão de fermentação natural é simplesmente divino. Sinto-me em Paris.",
    author: "Joana M.",
    source: "via TripAdvisor",
  },
  {
    text: "Atendimento impecável e produtos de altíssima qualidade. O sanduíche na ciabatta é maravilhoso. Virei fã!",
    author: "Carlos Alberto S.",
    source: "via Instagram",
  },
  {
    text: "Lugar perfeito para um brunch no fim de semana. As saladas são frescas e os doces são uma tentação. Recomendo muito!",
    author: "Fernanda L.",
    source: "via Google Reviews",
  },
];

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function AmelieCafePage() {
  const [currentView, setCurrentView] = useState("home");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const productsCollection = collection(db, "products");
    const unsubscribe = onSnapshot(productsCollection, (snapshot) => {
      const productsList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setProducts(productsList);
      setLoadingProducts(false);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    if (selectedProduct) {
      setSelectedProduct(null);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getTotalItems = () =>
    cart.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () =>
    cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleWhatsAppCheckout = () => {
    let message = "Olá, Amélie Café! Gostaria de fazer o seguinte pedido:\n\n";
    cart.forEach((item) => {
      message += `${item.quantity}x ${item.name} - R$ ${(
        item.price * item.quantity
      )
        .toFixed(2)
        .replace(".", ",")}\n`;
    });
    message += `\n*Total: R$ ${getTotalPrice().toFixed(2).replace(".", ",")}*`;
    const whatsappUrl = `https://wa.me/5549988971552?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const navigateTo = (view: string) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch (currentView) {
      case "sobre":
        return <SobreView />;
      case "produtos":
        return (
          <ProdutosView
            products={products}
            loading={loadingProducts}
            onProductClick={setSelectedProduct}
            onAddToCart={addToCart}
          />
        );
      case "unidades":
        return <UnidadesView />;
      case "home":
      default:
        return <HomeView onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <button
            onClick={() => navigateTo("home")}
            className="relative h-16 w-40"
          >
            <Image
              src="/logo-amelie.png"
              alt="Amélie Café Logo"
              layout="fill"
              objectFit="contain"
            />
          </button>
          <nav className="hidden md:flex space-x-8">
            {["home", "sobre", "produtos", "unidades"].map((view) => (
              <button
                key={view}
                onClick={() => navigateTo(view)}
                className={`text-sm font-medium uppercase tracking-wider relative pb-1 ${
                  currentView === view
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                } transition-colors`}
              >
                {view.replace("sobre", "sobre nós")}
                {currentView === view && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </nav>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-foreground hover:text-primary transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="animate-in">{renderView()}</main>

      <footer className="bg-foreground text-background py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <a
              href="https://www.instagram.com/ameliecafelages/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a
              href="https://www.facebook.com/p/Amelie-Caf%C3%A9-100068823692365/?locale=pt_BR&_rdr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              <Facebook className="w-6 h-6" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2018 Amélie Café - Todos os direitos reservados.
          </p>
        </div>
      </footer>

      <a
        href="https://wa.me/5549988971552"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-110 z-40 flex items-center space-x-3"
      >
        <MessageSquare className="w-6 h-6" />
      </a>

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold font-serif">A Sua Sacola</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">
                  A sua sacola está vazia.
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.name}</h4>
                      <p className="text-primary font-semibold text-sm">
                        R$ {item.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-1 border rounded hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 bg-gray-100 rounded text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-1 border rounded hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary">
                    R$ {getTotalPrice().toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold"
                >
                  Finalizar Pedido no WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white h-full flex flex-col p-6">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="self-end p-2 mb-8"
            >
              <X className="w-6 h-6" />
            </button>
            <nav className="flex flex-col space-y-6">
              {["home", "sobre", "produtos", "unidades"].map((view) => (
                <button
                  key={view}
                  onClick={() => navigateTo(view)}
                  className={`text-left text-lg font-medium transition-colors ${
                    currentView === view
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {view.toUpperCase().replace("SOBRE", "SOBRE NÓS")}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTES PARA AS VIEWS ---

const HomeView = ({ onNavigate }: { onNavigate: (view: string) => void }) => (
  <>
    <section className="relative h-[90vh] flex items-center justify-center text-center overflow-hidden">
      <Image
        src="/home-amelie.png"
        alt="Ambiente acolhedor do Amélie Café"
        layout="fill"
        objectFit="cover"
        className="z-0"
        priority
      />
      <div className="absolute inset-0 bg-black/50 z-10" />
      <div className="relative z-20 text-white px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif">
          Amélie Café
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Pães de fermentação natural, cafés especiais e um toque de Paris em
          Lages.
        </p>
        <button
          onClick={() => onNavigate("produtos")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
        >
          Leve um pouco de nós para casa
        </button>
      </div>
    </section>
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8 font-serif">
          Um Pedacinho da França em Lages
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
          Desde outubro de 2018, quando abrimos a nossa primeira unité na Frei
          Gabriel, temos a missão de trazer a sofisticação parisiense para a
          Serra Catarinense. A nossa paixão pela excelência reflete-se em cada
          pão artesanal e em cada chávena de café especial que servimos.
        </p>
        <button
          onClick={() => onNavigate("sobre")}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 rounded-lg border-2 font-semibold transition-colors"
        >
          Conheça a nossa história
        </button>
      </div>
    </section>
  </>
);

const SobreView = () => (
  <>
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <Image
              src="/ambience.png"
              alt="Interior do Amélie Café"
              width={765}
              height={1020}
              className="rounded-lg object-cover w-full h-auto shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-6 font-serif">
              Notre Histoire
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              "Nós somos um pedacinho de Paris dentro da Serra Catarinense" —
              esse é o relato que nos orgulha. Inspirados pelo requinte
              parisiense, oferecemos uma experiência íntima, onde celebramos o
              ritual do café com produtos artesanais de excelência.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A nossa atmosfera acolhedora convida a uma pausa deliciosa entre
              conversas suaves, harmonizando sabores autênticos com o charme
              francês.
            </p>
          </div>
        </div>
      </div>
    </section>
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-serif">
            As Nossas Delícias Artesanais
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
            Cada item é uma celebração ao feito à mão, com ingredientes frescos
            e técnicas clássicas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-background rounded-lg overflow-hidden shadow-sm flex flex-col">
            <Image
              src="/baguette.png"
              alt="Pães variados"
              width={1080}
              height={1350}
              className="w-full h-[450px] object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold font-serif mb-2">
                Pães de Fermentação Natural
              </h3>
              <p className="text-muted-foreground">
                Diariamente, assamos baguetes, ciabattas e o nosso exclusivo
                Tordu, todos com casca crocante e miolo macio.
              </p>
            </div>
          </div>
          <div className="bg-background rounded-lg overflow-hidden shadow-sm flex flex-col">
            <Image
              src="/torta.png"
              alt="Tortas e doces"
              width={1080}
              height={1350}
              className="w-full h-[450px] object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold font-serif mb-2">
                Tortas e Doces
              </h3>
              <p className="text-muted-foreground">
                As nossas vitrines são uma tentação. Explore as nossas tortas
                cremosas, mousses delicados e uma seleção de doces que são pura
                arte.
              </p>
            </div>
          </div>
          <div className="bg-background rounded-lg overflow-hidden shadow-sm flex flex-col">
            <Image
              src="/croissant-pistache.png"
              alt="Croissant de pistache"
              width={1080}
              height={1350}
              className="w-full h-[450px] object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold font-serif mb-2">
                Croissants & Sanduíches
              </h3>
              <p className="text-muted-foreground">
                A perfeição em massa folhada. Experimente o nosso famoso
                croissant recheado com creme de pistache ou os nossos sanduíches
                especiais.
              </p>
            </div>
          </div>
          <div className="bg-background rounded-lg overflow-hidden shadow-sm flex flex-col">
            <Image
              src="/brunch.png"
              alt="Prato de brunch"
              width={1080}
              height={1350}
              className="w-full h-[450px] object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold font-serif mb-2">
                Brunch & Almoço
              </h3>
              <p className="text-muted-foreground">
                A qualquer hora, desfrute do nosso brunch e saladas. Pratos de
                almoço servidos das 11:30 às 13:30.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 font-serif">
          O que dizem os nossos clientes
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border-l-4 border-primary shadow-sm"
            >
              <p className="text-muted-foreground italic mb-4">
                "{testimonial.text}"
              </p>
              <div className="text-right">
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.source}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

const ProdutosView = ({
  products,
  loading,
  onProductClick,
  onAddToCart,
}: {
  products: Product[];
  loading: boolean;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}) => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold font-serif">A Nossa Boutique</h2>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          Leve o sabor e o charme do Amélie Café para a sua casa.
        </p>
      </div>
      {loading ? (
        <p className="text-center">A carregar produtos...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-background rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow flex flex-col group"
            >
              <div
                className="relative cursor-pointer"
                onClick={() => onProductClick(product)}
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-56 object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4">
                  <span className="text-xl font-bold text-primary">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="bg-primary p-2 rounded-full text-primary-foreground hover:bg-primary/90 transition-transform group-hover:scale-110"
                    aria-label="Adicionar à sacola"
                  >
                    <ShoppingBag size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
);

const UnidadesView = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold font-serif">Onde nos encontrar</h2>
        <p className="text-lg text-muted-foreground mt-4">
          Há sempre um Amélie Café perto de si.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {locations.map((location, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow flex flex-col overflow-hidden"
          >
            <div className="relative w-full h-48">
              <Image
                src={location.image}
                alt={`Foto da ${location.name}`}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold font-serif mb-2">
                {location.name}
              </h3>
              <p className="text-muted-foreground whitespace-pre-line flex-1 mb-4">
                {location.hours}
              </p>
            </div>
            <div className="p-6 pt-0">
              <a
                href={location.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full py-2 rounded-lg border-2 font-semibold transition-colors flex items-center justify-center"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Ver no Mapa
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- COMPONENTE MODAL DE DETALHES DO PRODUTO ---
const ProductDetailModal = ({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in-0 duration-300"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-md md:max-w-4xl bg-white rounded-lg shadow-xl m-4"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-10"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="grid md:grid-cols-2">
        <div className="relative h-80 md:h-[500px]">
          <Image
            src={product.image}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg md:rounded-l-lg md:rounded-t-none"
          />
        </div>
        <div className="p-6 flex flex-col">
          <h2 className="text-3xl font-bold font-serif mb-2">{product.name}</h2>
          <div className="text-muted-foreground text-base mb-4 flex-grow overflow-y-auto max-h-48 pr-2">
            {product.description.split("\n").map((line, i) => (
              <p key={i} className="mb-2">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-3xl font-bold text-primary">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <button
              onClick={() => onAddToCart(product)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold flex items-center justify-center text-lg"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Adicionar à Sacola
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
