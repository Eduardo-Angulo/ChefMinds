
import React, { useState, useRef } from 'react';
import { getMealSuggestion, generateMealImage } from './geminiService';
import { MealSuggestion } from './types';

const App: React.FC = () => {
  const [preference, setPreference] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<MealSuggestion | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recipeRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preference.trim()) return;

    setLoading(true);
    setError(null);
    setSuggestion(null);
    setImageUrl(null);

    try {
      const mealData = await getMealSuggestion(preference);
      setSuggestion(mealData);
      
      const img = await generateMealImage(mealData.imagePrompt);
      setImageUrl(img);
    } catch (err) {
      console.error(err);
      setError('Lo sentimos, algo salió mal al preparar tu sugerencia. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!recipeRef.current || !suggestion) return;

    // Seleccionamos el contenedor de la receta
    const element = recipeRef.current;
    
    // Configuraciones para html2pdf
    const opt = {
      margin: 10,
      filename: `Receta-${suggestion.recipe.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false,
        letterRendering: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // @ts-ignore - html2pdf se carga globalmente desde CDN en index.html
      const html2pdf = window.html2pdf;
      if (!html2pdf) {
        throw new Error("Librería html2pdf no encontrada");
      }

      // Iniciamos el proceso de guardado
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert("No se pudo generar el PDF. Intenta usar la opción de Imprimir.");
    }
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-orange-600 font-medium animate-pulse">Cocinando ideas para ti...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-500 p-1.5 rounded-lg">
              <i className="fa-solid fa-utensils text-white"></i>
            </div>
            <span className="font-serif text-xl font-bold tracking-tight">ChefMinds</span>
          </div>
          <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Sugerencias AI</div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12 no-print">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            ¿Qué se te antoja hoy?
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Dinos una preferencia y diseñaremos el plato perfecto para ti.
          </p>
        </header>

        {/* Input Form */}
        <section className="max-w-2xl mx-auto mb-16 no-print">
          <form onSubmit={handleSubmit} className="relative group">
            <input
              type="text"
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              placeholder="Escribe tu preferencia aquí..."
              className="w-full px-6 py-5 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all text-lg pr-32"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !preference.trim()}
              className="absolute right-2 top-2 bottom-2 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-xl font-bold transition-colors flex items-center space-x-2"
            >
              <span>Generar</span>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </button>
          </form>
          {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        </section>

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Result State */}
        {suggestion && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Contenido de la Receta - Este es el bloque que captura el PDF */}
            <div className="lg:col-span-7">
              <div 
                ref={recipeRef} 
                id="recipe-content"
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
                style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
              >
                {/* Cabecera del PDF (solo visible en PDF/Impresión) */}
                <div className="hidden print:block mb-6 border-b pb-4">
                   <h1 className="text-2xl font-serif font-bold text-orange-600">ChefMinds - Receta Sugerida</h1>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold uppercase border border-orange-100">
                    <i className="fa-solid fa-clock mr-1"></i> {suggestion.recipe.cookingTime}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase border border-blue-100">
                    <i className="fa-solid fa-gauge-high mr-1"></i> {suggestion.recipe.difficulty}
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase border border-green-100">
                    <i className="fa-solid fa-fire mr-1"></i> {suggestion.recipe.calories}
                  </span>
                </div>
                
                <h2 className="text-3xl font-serif font-bold mb-4 text-slate-900">{suggestion.recipe.name}</h2>
                <p className="text-slate-700 text-lg leading-relaxed mb-8">{suggestion.recipe.description}</p>

                {/* Imagen del plato - IMPORTANTE: Se muestra tanto en web como en PDF */}
                {imageUrl && (
                  <div className="mb-8 rounded-2xl overflow-hidden shadow-md">
                    <img 
                      src={imageUrl} 
                      alt={suggestion.recipe.name} 
                      className="w-full h-auto block"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                )}

                <div className="space-y-10">
                  <section>
                    <h3 className="text-xl font-bold mb-4 flex items-center text-slate-900 border-b pb-2 border-slate-100">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm">
                        <i className="fa-solid fa-list"></i>
                      </span>
                      Ingredientes
                    </h3>
                    <ul className="space-y-2">
                      {suggestion.recipe.ingredients.map((item, i) => (
                        <li key={i} className="flex items-start text-slate-800">
                          <i className="fa-solid fa-check text-orange-500 mr-3 mt-1.5 text-xs"></i>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold mb-4 flex items-center text-slate-900 border-b pb-2 border-slate-100">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm">
                        <i className="fa-solid fa-utensils"></i>
                      </span>
                      Preparación
                    </h3>
                    <div className="space-y-6">
                      {suggestion.recipe.steps.map((step, i) => (
                        <div key={i} className="flex space-x-4">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                            {i + 1}
                          </span>
                          <p className="text-slate-800 leading-relaxed flex-1">{step}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                
                <footer className="mt-12 pt-6 border-t border-slate-100 text-center hidden print:block text-xs text-slate-400">
                  ChefMinds AI • Generado para tu preferencia: "{preference}"
                </footer>
              </div>
            </div>

            {/* Sidebar con botones de acción (solo web) */}
            <div className="lg:col-span-5 space-y-6 no-print">
              <div className="sticky top-24">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                  <h4 className="text-lg font-bold mb-4 text-slate-800">Opciones</h4>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={downloadPDF}
                      className="w-full py-4 px-6 bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-[0.98]"
                    >
                      <i className="fa-solid fa-file-pdf"></i>
                      <span>Guardar como PDF</span>
                    </button>

                    <button 
                      onClick={() => window.print()}
                      className="w-full py-3 px-6 bg-slate-100 text-slate-700 rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:bg-slate-200 transition-all"
                    >
                      <i className="fa-solid fa-print"></i>
                      <span>Imprimir Receta</span>
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      <i className="fa-solid fa-circle-info mr-2"></i>
                      El PDF descargable incluirá la imagen y todos los pasos de la receta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popular Suggestions */}
        {!suggestion && !loading && (
          <section className="mt-12 no-print">
            <h3 className="text-center font-bold text-slate-400 uppercase tracking-widest text-sm mb-8">Sugerencias Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Cena ligera", icon: "leaf", pref: "Algo saludable y ligero para la cena" },
                { label: "Receta rápida", icon: "bolt", pref: "Pasta que se pueda hacer en menos de 20 min" },
                { label: "Sabor picante", icon: "pepper-hot", pref: "Comida con un toque picante de México o Asia" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setPreference(item.pref)}
                  className="p-6 bg-white border border-slate-100 rounded-2xl text-left hover:border-orange-200 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-50 transition-colors">
                    <i className={`fa-solid fa-${item.icon} text-slate-400 group-hover:text-orange-500`}></i>
                  </div>
                  <div className="font-bold text-slate-800">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-1 italic">{item.pref}</div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-24 py-12 border-t border-slate-100 bg-white no-print">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            ChefMinds v1.4 • Generación Inteligente de Gastronomía
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
