"use client";
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, DollarSign, Activity, ChevronRight, Zap, Sparkles, ArrowRight, BarChart3, Loader2, LayoutDashboard, Target, Sun, Moon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ProductItem {
  id: number;
  name: string;
  category: string;
  base_cost: number;
  current_price: number;
  elasticity: number;
}

interface SalesHistoryItem {
  id: number;
  product_id: number;
  date: string;
  price: number;
  competitor_price: number;
  demand: number;
  revenue: number;
}

interface OptimizationResult {
  current_price: number;
  optimal_price: number;
  price_change_percentage: number;
  predicted_demand: number;
  predicted_profit: number;
}

interface SummaryData {
  total_revenue: number;
  total_products: number;
  revenue_by_category: { name: string; value: number }[];
  global_trend: { date: string; revenue: number }[];
  top_products: { id: number; name: string; category: string; revenue: number }[];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'optimizer'>('overview');
  const [isDark, setIsDark] = useState(true);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [history, setHistory] = useState<SalesHistoryItem[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
      
    fetch(`${API_BASE_URL}/api/summary`)
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error(err));
  }, []);

  const handleSelectProduct = (productId: number) => {
    fetch(`${API_BASE_URL}/api/product/${productId}`)
      .then(res => res.json())
      .then(data => {
        setSelectedProduct(data.product);
        const formattedHistory = data.history.reverse().map((item: any) => ({
          ...item,
          revenue: Number(item.revenue),
          price: Number(item.price),
          competitor_price: Number(item.competitor_price)
        }));
        setHistory(formattedHistory);
        setOptimizationResult(null);
      });
  };

  const handleOptimize = (productId: number) => {
    setOptimizing(true);
    setOptimizationResult(null);
    fetch(`${API_BASE_URL}/api/optimize/${productId}`)
      .then(res => res.json())
      .then(data => {
        setOptimizationResult(data);
        setOptimizing(false);
      })
      .catch(err => {
        console.error(err);
        setOptimizing(false);
      });
  };

  const handleApplyPrice = () => {
    if (!selectedProduct || !optimizationResult) return;
    
    fetch(`${API_BASE_URL}/api/apply_price/${selectedProduct.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_price: optimizationResult.optimal_price })
    })
    .then(res => res.json())
    .then(data => {
      setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, current_price: data.new_price } : p));
      setSelectedProduct({ ...selectedProduct, current_price: data.new_price });
      setOptimizationResult(null);
    })
    .catch(err => console.error(err));
  };

  const themeClasses = {
    bg: isDark ? "bg-[#0A0A0A]" : "bg-slate-50",
    text: isDark ? "text-slate-50" : "text-slate-900",
    card: isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-sm",
    cardHover: isDark ? "hover:bg-white/[0.04] hover:border-white/15" : "hover:bg-slate-50 hover:border-slate-300",
    header: isDark ? "bg-black/40 border-white/5" : "bg-white/80 border-slate-200",
    tabBg: isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200",
    tabActive: isDark ? "bg-white/10 text-white" : "bg-white text-slate-900 shadow-sm",
    muted: isDark ? "text-white/40" : "text-slate-500",
    chartStroke: isDark ? "#ffffff20" : "#00000020",
    chartGrid: isDark ? "#ffffff05" : "#00000005",
    chartTick: isDark ? "#ffffff40" : "#64748b"
  };

  return (
    <div className={cn("min-h-screen font-sans selection:bg-indigo-500/30 overflow-hidden relative transition-colors duration-500", themeClasses.bg, themeClasses.text)}>
      {/* Ambient Background Glows */}
      {isDark && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
        </>
      )}

      <header className={cn("sticky top-0 z-50 border-b backdrop-blur-2xl transition-colors", themeClasses.header)}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className={cn("font-semibold text-2xl tracking-tight", isDark ? "text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60" : "text-slate-900")}>
              Nexus Pricing AI
            </h1>
          </div>
          
          <div className={cn("flex p-1 rounded-xl border transition-colors", themeClasses.tabBg)}>
            <button 
              onClick={() => setActiveTab('overview')}
              className={cn("px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all", activeTab === 'overview' ? themeClasses.tabActive : isDark ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700")}
            >
              <LayoutDashboard className="w-4 h-4" /> Global Overview
            </button>
            <button 
              onClick={() => setActiveTab('optimizer')}
              className={cn("px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all", activeTab === 'optimizer' ? themeClasses.tabActive : isDark ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700")}
            >
              <Target className="w-4 h-4" /> Price Optimizer
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className={cn("p-2 rounded-xl border transition-all", themeClasses.tabBg, isDark ? "text-yellow-400" : "text-indigo-600")}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium", isDark ? "bg-white/5 border-white/10 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600")}>
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isDark ? "bg-emerald-400" : "bg-emerald-500")} />
              Live RL Environment
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && summary ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-6">
                <div className={cn("rounded-3xl p-8 relative overflow-hidden group border transition-all", themeClasses.card)}>
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={cn("mb-3 flex items-center gap-2 font-medium", themeClasses.muted)}>
                    <DollarSign className="w-5 h-5 text-indigo-400"/> Total Store Revenue
                  </div>
                  <div className={cn("text-5xl font-bold font-mono tracking-tight", isDark ? "text-white/90" : "text-slate-900")}>
                    ${(summary.total_revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className={cn("rounded-3xl p-8 relative overflow-hidden group border transition-all", themeClasses.card)}>
                  <div className={cn("mb-3 flex items-center gap-2 font-medium", themeClasses.muted)}>
                    <Package className="w-5 h-5 text-purple-400"/> Total AI-Managed Products
                  </div>
                  <div className={cn("text-5xl font-bold font-mono tracking-tight", isDark ? "text-white/90" : "text-slate-900")}>
                    {summary.total_products} <span className={cn("text-xl", themeClasses.muted)}>items</span>
                  </div>
                </div>
                <div className={cn("rounded-3xl p-8 relative border transition-all", isDark ? "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/20" : "bg-indigo-50 border-indigo-100 shadow-sm")}>
                  <div className={cn("mb-3 flex items-center gap-2 font-medium", isDark ? "text-indigo-200" : "text-indigo-600")}>
                    <TrendingUp className="w-5 h-5"/> Store Performance Status
                  </div>
                  <div className={cn("text-3xl font-semibold", isDark ? "text-emerald-400" : "text-emerald-600")}>
                    Optimal <span className={isDark ? "text-emerald-500/50" : "text-emerald-600/50"}>/ Learning Active</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Global Trend Chart */}
                <div className={cn("col-span-2 rounded-3xl p-8 min-h-[400px] flex flex-col border transition-all", themeClasses.card)}>
                  <h3 className={cn("text-xl font-medium mb-6 flex items-center gap-3", isDark ? "text-white/80" : "text-slate-800")}>
                    <Activity className="text-indigo-400" /> 30-Day Global Revenue Trend
                  </h3>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={summary.global_trend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGlobalRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke={themeClasses.chartStroke} tick={{fill: themeClasses.chartTick}} tickLine={false} axisLine={false} minTickGap={30} />
                        <YAxis stroke={themeClasses.chartStroke} tick={{fill: themeClasses.chartTick}} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <CartesianGrid strokeDasharray="3 3" stroke={themeClasses.chartGrid} vertical={false} />
                        <RechartsTooltip 
                          formatter={(value: any) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          contentStyle={{ backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', borderColor: themeClasses.chartStroke, borderRadius: '12px', color: isDark ? '#f8fafc' : '#0f172a' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorGlobalRev)" name="Total Revenue" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Pie Chart */}
                <div className={cn("col-span-1 rounded-3xl p-8 flex flex-col items-center justify-center relative border transition-all", themeClasses.card)}>
                  <h3 className={cn("text-xl font-medium mb-2 w-full text-left", isDark ? "text-white/80" : "text-slate-800")}>Revenue by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={summary.revenue_by_category} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                        {summary.revenue_by_category.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                        contentStyle={{ backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', borderColor: themeClasses.chartStroke, borderRadius: '12px', color: isDark ? '#f8fafc' : '#0f172a' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 justify-center mt-4">
                    {summary.revenue_by_category.map((entry: any, index: number) => (
                      <div key={index} className={cn("flex items-center gap-2 text-sm", themeClasses.muted)}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {entry.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className={cn("rounded-3xl p-8 border transition-all", themeClasses.card)}>
                 <h3 className={cn("text-xl font-medium mb-6 flex items-center gap-3", isDark ? "text-white/80" : "text-slate-800")}>
                    <TrendingUp className="text-emerald-400" /> Top 5 Best Performing Products
                  </h3>
                  <div className="w-full">
                    <div className={cn("grid grid-cols-4 text-sm font-medium border-b pb-4 mb-4 px-4", themeClasses.muted, isDark ? "border-white/5" : "border-slate-100")}>
                      <div>Rank</div>
                      <div className="col-span-2">Product Details</div>
                      <div className="text-right">Total Revenue</div>
                    </div>
                    {summary.top_products.map((p: any, idx: number) => (
                      <div key={p.id} className={cn("grid grid-cols-4 items-center px-4 py-4 rounded-xl transition-colors border-b last:border-0", isDark ? "hover:bg-white/[0.02] border-white/5" : "hover:bg-slate-50 border-slate-50")}>
                        <div className={cn("text-2xl font-black font-mono", isDark ? "text-white/20" : "text-slate-200")}>#{idx + 1}</div>
                        <div className="col-span-2">
                          <div className={cn("font-medium", isDark ? "text-white/90" : "text-slate-900")}>{p.name}</div>
                          <div className={cn("text-xs mt-1 uppercase tracking-wider", themeClasses.muted)}>{p.category}</div>
                        </div>
                        <div className="text-right font-mono text-lg font-semibold text-emerald-500">
                          ${p.revenue.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
              </div>

            </motion.div>
          ) : activeTab === 'optimizer' ? (
            <motion.div 
              key="optimizer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex gap-8 h-full"
            >
              {/* Product Catalog */}
              <div className="w-1/3 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={cn("text-lg font-medium flex items-center gap-2", isDark ? "text-white/90" : "text-slate-800")}>
                    <Package className="w-5 h-5 text-indigo-400" />
                    Catalog
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-3 custom-scrollbar">
                  {products.map((product, idx) => (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                        selectedProduct?.id === product.id
                          ? isDark ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)]" : "bg-indigo-50 border-indigo-200 shadow-sm"
                          : themeClasses.card,
                        themeClasses.cardHover
                      )}
                    >
                      {selectedProduct?.id === product.id && (
                        <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                      )}
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <div className={cn("font-medium text-base", selectedProduct?.id === product.id ? "text-indigo-600" : isDark ? "text-white/90" : "text-slate-900")}>{product.name}</div>
                          <div className={cn("text-xs mt-1 font-medium tracking-wide uppercase", themeClasses.muted)}>{product.category}</div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className={cn(
                            "font-semibold text-lg font-mono",
                            selectedProduct?.id === product.id ? "text-indigo-500" : isDark ? "text-white/70" : "text-slate-700"
                          )}>
                            ${product.current_price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Optimizer Details */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <AnimatePresence mode="wait">
                  {selectedProduct ? (
                    <motion.div 
                      key={selectedProduct.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col h-full gap-6"
                    >
                      <div className="grid grid-cols-3 gap-4">
                        <div className={cn("rounded-2xl p-6 relative overflow-hidden group border transition-all", themeClasses.card)}>
                          <div className={cn("mb-2 flex items-center gap-2 text-sm font-medium", themeClasses.muted)}>
                            <DollarSign className="w-4 h-4"/> Current Price
                          </div>
                          <div className={cn("text-4xl font-semibold font-mono tracking-tight", isDark ? "text-white/90" : "text-slate-900")}>
                            ${selectedProduct.current_price.toFixed(2)}
                          </div>
                        </div>
                        
                        <div className={cn("rounded-2xl p-6 relative overflow-hidden group border transition-all", themeClasses.card)}>
                          <div className={cn("mb-2 flex items-center gap-2 text-sm font-medium", themeClasses.muted)}>
                            <TrendingUp className="w-4 h-4"/> Base Cost
                          </div>
                          <div className={cn("text-4xl font-semibold font-mono tracking-tight", isDark ? "text-white/50" : "text-slate-400")}>
                            ${selectedProduct.base_cost.toFixed(2)}
                          </div>
                        </div>

                        <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                          <button
                            onClick={() => handleOptimize(selectedProduct.id)}
                            disabled={optimizing}
                            className={cn(
                              "relative w-full h-full rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 text-lg border",
                              optimizing 
                                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 cursor-not-allowed" 
                                : isDark ? "bg-[#0A0A0A] border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-500" : "bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                            )}
                          >
                            {optimizing ? (
                              <><Loader2 className="w-5 h-5 animate-spin" /> Running RL Agent...</>
                            ) : (
                              <><Zap className="w-5 h-5" /> Optimize Price</>
                            )}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {optimizationResult && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className={cn("border rounded-3xl p-8 relative backdrop-blur-sm transition-all", isDark ? "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/20" : "bg-white border-slate-200 shadow-xl")}>
                              {isDark && <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />}
                              <div className="flex items-center justify-between mb-8">
                                <h3 className={cn("text-xl font-medium flex items-center gap-3", isDark ? "text-white/90" : "text-slate-800")}>
                                  <Sparkles className="text-indigo-400 w-5 h-5" /> AI Recommendation
                                </h3>
                              </div>
                              <div className="grid grid-cols-4 gap-8">
                                <div>
                                  <div className={cn("text-sm font-medium mb-3", themeClasses.muted)}>Optimal Price</div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className={cn("text-4xl font-bold font-mono", isDark ? "text-white" : "text-slate-900")}>
                                      ${optimizationResult.optimal_price.toFixed(2)}
                                    </div>
                                    <div className={cn(
                                      "text-sm font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap",
                                      optimizationResult.price_change_percentage > 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                    )}>
                                      {optimizationResult.price_change_percentage > 0 ? '+' : ''}{optimizationResult.price_change_percentage}%
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className={cn("text-sm font-medium mb-3", themeClasses.muted)}>Forecasted Demand</div>
                                  <div className={cn("text-3xl font-semibold font-mono", isDark ? "text-white/80" : "text-slate-700")}>
                                    {optimizationResult.predicted_demand} <span className={cn("text-lg", themeClasses.muted)}>units</span>
                                  </div>
                                </div>
                                <div>
                                  <div className={cn("text-sm font-medium mb-3", themeClasses.muted)}>Projected Profit</div>
                                  <div className="text-3xl font-semibold text-emerald-500 font-mono">
                                    ${optimizationResult.predicted_profit.toFixed(2)}
                                  </div>
                                </div>
                                <div className="flex items-end justify-end">
                                  <button onClick={handleApplyPrice} className={cn("group relative px-6 py-3 w-full font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden", isDark ? "bg-white text-black hover:bg-white/90" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md")}>
                                    <span className="relative z-10">Apply Price</span>
                                    <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className={cn("rounded-3xl p-8 flex-1 flex flex-col min-h-[350px] border transition-all", themeClasses.card)}>
                        <div className="flex items-center gap-3 mb-8">
                          <BarChart3 className={cn("w-5 h-5", themeClasses.muted)} />
                          <h3 className={cn("text-lg font-medium", isDark ? "text-white/80" : "text-slate-800")}>Market Analytics & Demand Curve</h3>
                        </div>
                        <div className="flex-1 w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" stroke={themeClasses.chartStroke} tick={{fill: themeClasses.chartTick, fontSize: 12}} tickLine={false} axisLine={false} minTickGap={30} />
                              <YAxis yAxisId="left" type="number" stroke={themeClasses.chartStroke} tick={{fill: themeClasses.chartTick, fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} domain={['auto', 'auto']} />
                              <YAxis yAxisId="right" orientation="right" type="number" stroke={themeClasses.chartStroke} tick={{fill: themeClasses.chartTick, fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} domain={['auto', 'auto']} />
                              <CartesianGrid strokeDasharray="3 3" stroke={themeClasses.chartGrid} vertical={false} />
                              <RechartsTooltip contentStyle={{ backgroundColor: isDark ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', borderColor: themeClasses.chartStroke, borderRadius: '16px', color: isDark ? '#f8fafc' : '#0f172a', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }} itemStyle={{ color: isDark ? '#e2e8f0' : '#475569', fontSize: '14px' }} labelStyle={{ color: isDark ? '#ffffff60' : '#64748b', fontSize: '12px', marginBottom: '8px' }} />
                              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" />
                              <Line yAxisId="right" type="stepAfter" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} name="Our Price" />
                              <Line yAxisId="right" type="stepAfter" dataKey="competitor_price" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Competitor Price" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("h-full flex flex-col items-center justify-center text-center rounded-3xl border-dashed border-2 transition-all", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
                      <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner", isDark ? "bg-white/5 shadow-white/5" : "bg-white shadow-slate-100")}>
                        <Package className={cn("w-10 h-10", isDark ? "text-white/20" : "text-slate-300")} />
                      </div>
                      <h3 className={cn("text-xl font-medium tracking-tight", isDark ? "text-white/80" : "text-slate-600")}>Select a product to analyze</h3>
                      <p className={cn("mt-3 text-sm max-w-sm leading-relaxed", themeClasses.muted)}>Choose a product from the catalog to view historical market trends and run the RL agent for optimal pricing.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}; }
      `}} />
    </div>
  );
}
