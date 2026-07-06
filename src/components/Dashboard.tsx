import React, { useState } from "react";
import { KreativeItem, SubscriptionType, ItemType, Template } from "../types";
import { TEMPLATES } from "../data/templates";
import { 
  Plus, 
  FileText, 
  Monitor, 
  Layout, 
  Search, 
  Sparkles, 
  AlertCircle, 
  Shield, 
  Landmark, 
  Trash2, 
  ArrowRight, 
  BookOpen, 
  Users, 
  HelpCircle, 
  Check, 
  Cloud, 
  UploadCloud, 
  LogOut, 
  RefreshCw,
  Video,
  User as UserIcon,
  Download,
  Upload
} from "lucide-react";
import { getItemSize, getSubscriptionStorageLimit, formatBytes } from "../lib/storageUtils";

interface DashboardProps {
  items: KreativeItem[];
  subscription: SubscriptionType;
  onCreateItem: (name: string, type: ItemType, templateId?: string) => void;
  onDeleteItem: (id: string) => void;
  onSelectItem: (id: string) => void;
  onNavigateToPricing: () => void;
  user: any;
  token: string | null;
  isLoadingDrive: boolean;
  driveError: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onImportLocal: () => void;
  aiUsage?: number;
  aiLimit?: number;
  orgMembers?: Array<{ name: string; role: string; email: string }>;
  inviteCodes?: string[];
  onJoinOrg?: (code: string) => boolean;
  onAddInviteCode?: () => string;
  onRemoveInviteCode?: (code: string) => void;
  onAddOrgMember?: (name: string, role: string, email: string) => void;
  onRemoveOrgMember?: (email: string) => void;
  watermarkFreeLeft?: number;
  onImportKreative: (item: KreativeItem) => void;
}

export default function Dashboard({
  items,
  subscription,
  onCreateItem,
  onDeleteItem,
  onSelectItem,
  onNavigateToPricing,
  user,
  token,
  isLoadingDrive,
  driveError,
  onLogin,
  onLogout,
  onImportLocal,
  aiUsage = 142,
  aiLimit = 500,
  orgMembers = [],
  inviteCodes = [],
  onJoinOrg,
  onAddInviteCode,
  onRemoveInviteCode,
  onAddOrgMember,
  onRemoveOrgMember,
  watermarkFreeLeft = 25,
  onImportKreative,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | ItemType>("all");
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<ItemType>("document");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [limitWarning, setLimitWarning] = useState(false);

  // Filter templates based on type
  const [templateFilter, setTemplateFilter] = useState<ItemType>("document");

  // Free limit check (item count limit)
  const FREE_LIMIT = 2;
  const isLimitReached = subscription === "free" && items.length >= FREE_LIMIT;

  // Storage calculations
  const totalStorageUsed = items.reduce((acc, item) => acc + getItemSize(item), 0);
  const storageLimit = getSubscriptionStorageLimit(subscription);
  const isStorageLimitReached = totalStorageUsed >= storageLimit;

  const handleCreatePrompt = () => {
    if (isLimitReached || isStorageLimitReached) {
      setLimitWarning(true);
      return;
    }
    setNewItemName("");
    setShowCreateModal(true);
  };

  const executeCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached || isStorageLimitReached) {
      setLimitWarning(true);
      setShowCreateModal(false);
      return;
    }
    const name = newItemName.trim() || `Ny ${newItemType === "document" ? "Dokument" : newItemType === "presentation" ? "Presentation" : newItemType === "video" ? "Video" : newItemType === "story" ? "Berättelse" : "Sida"}`;
    onCreateItem(name, newItemType);
    setShowCreateModal(false);
  };

  const handleTemplateSelect = (template: Template) => {
    if (isLimitReached || isStorageLimitReached) {
      setLimitWarning(true);
      return;
    }
    // Check template restriction
    if (template.isPremium && subscription === "free") {
      alert("Denna mall kräver Office Pack eller Organization Pack. Vänligen uppgradera din licens!");
      onNavigateToPricing();
      return;
    }
    if (template.isOrgOnly && subscription !== "organization") {
      alert("Denna mall är exklusiv för skolor och företag under Organization Pack. Vänligen välj den planen!");
      onNavigateToPricing();
      return;
    }

    const defaultName = `${template.name}`;
    onCreateItem(defaultName, template.type, template.id);
  };

  const handleDownloadKreative = (item: KreativeItem) => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(item, null, 2)], { type: "application/json;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${item.name.toLowerCase().replace(/\s+/g, "-") || "projekt"}.kreative`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleUploadKreative = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const importedItem = JSON.parse(text) as KreativeItem;

        // Simple validation
        if (!importedItem.name || !importedItem.type || !importedItem.content) {
          alert("Ogiltig fil. Den importerade filen måste vara en giltig .kreative-fil.");
          return;
        }

        onImportKreative(importedItem);
      } catch (err) {
        console.error("Fel vid inläsning av fil:", err);
        alert("Kunde inte läsa filen. Kontrollera att filen har rätt format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div id="dashboard-view" className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      
      {/* Limit Warning Overlay Modal */}
      {limitWarning && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-scale-up">
            <AlertCircle className="w-12 h-12 text-indigo-600 mx-auto" />
            <h3 className="font-display font-bold text-slate-900 text-xl">Skapandegräns nådd!</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isStorageLimitReached ? (
                <span>
                  Ditt lagringsutrymme är fullt! Du har använt <strong>{formatBytes(totalStorageUsed)}</strong> av din gräns på <strong>{formatBytes(storageLimit)}</strong> för ditt nuvarande paket (<strong>{subscription === "free" ? "Free Trial" : subscription === "office" ? "Office Pack" : "Organization Pack"}</strong>). Ta bort några projekt eller uppgradera för att få mer utrymme.
                </span>
              ) : (
                <span>
                  Du använder <strong className="text-slate-800">Free Trial</strong> och kan skapa maximalt <strong>{FREE_LIMIT} st</strong> objekt samtidigt. Radera befintliga objekt eller uppgradera licensen för att få obegränsad tillgång.
                </span>
              )}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                id="btn-limit-upgrade"
                onClick={() => { setLimitWarning(false); onNavigateToPricing(); }}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all"
              >
                Uppgradera till Office Pack (99 kr)
              </button>
              <button
                id="btn-limit-close"
                onClick={() => setLimitWarning(false)}
                className="w-full py-2.5 px-4 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium text-xs rounded-xl cursor-pointer transition-all"
              >
                Stäng och visa mina objekt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={executeCreate} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Plus className="w-5 h-5 text-indigo-600" />
              <h3 className="font-display font-bold text-slate-900 text-lg">Skapa nytt objekt</h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Typ av skapelse</label>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: "document" as ItemType, label: "Dokument", icon: FileText },
                    { id: "presentation" as ItemType, label: "Presentation", icon: Monitor },
                    { id: "page" as ItemType, label: "Hemsida", icon: Layout },
                    { id: "video" as ItemType, label: "Video", icon: Video },
                    { id: "story" as ItemType, label: "Story", icon: Sparkles },
                  ].map((t) => {
                    const IconComp = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        id={`create-type-${t.id}`}
                        onClick={() => setNewItemType(t.id)}
                        className={`py-3 px-1 border rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          newItemType === t.id
                            ? "border-indigo-600 bg-indigo-50/20 text-indigo-700 font-semibold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600 text-xs"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px]">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Namnge ditt projekt</label>
                <input
                  type="text"
                  required
                  id="new-project-name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="t.ex. Läroplan Höst, Min Hemsida, Produktpitch..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-4">
              <button
                type="submit"
                id="execute-create-project"
                className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-xs transition-all"
              >
                Skapa nu
              </button>
              <button
                type="button"
                id="cancel-create-project"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium text-xs rounded-xl cursor-pointer transition-all"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Primary Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Bento Box 1: Hero Welcome & Quick Create Action Grid (col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors group relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none select-none">
            <Sparkles className="w-80 h-80 text-indigo-600 rotate-12" />
          </div>
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100/40">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Kostnadsfritt Skapande & AI
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-slate-900 leading-tight">
              Välkommen till KREATIVE Workspace
            </h1>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl">
              Här designar och utvecklar du snygga landningssidor, pedagogiska presentationer och välstrukturerade dokument på svenska med hjälp av intelligenta skrivverktyg.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skapa något nytt idag</span>
              <button
                id="dash-create-btn"
                onClick={handleCreatePrompt}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Skapa ny tom duk
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                id="create-quick-doc"
                type="button"
                onClick={() => {
                  if (isLimitReached) { setLimitWarning(true); return; }
                  setNewItemType("document");
                  setNewItemName("");
                  setShowCreateModal(true);
                }}
                className="flex flex-col items-start p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all text-left cursor-pointer group/btn"
              >
                <div className="w-9 h-9 bg-white rounded-xl shadow-xs mb-3 flex items-center justify-center text-lg group-hover/btn:scale-110 transition-transform">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="font-semibold text-xs text-slate-800">Dokument</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Skrivverktyg</span>
              </button>

              <button
                id="create-quick-pres"
                type="button"
                onClick={() => {
                  if (isLimitReached) { setLimitWarning(true); return; }
                  setNewItemType("presentation");
                  setNewItemName("");
                  setShowCreateModal(true);
                }}
                className="flex flex-col items-start p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all text-left cursor-pointer group/btn"
              >
                <div className="w-9 h-9 bg-white rounded-xl shadow-xs mb-3 flex items-center justify-center text-lg group-hover/btn:scale-110 transition-transform">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="font-semibold text-xs text-slate-800">Presentation</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Bildspel</span>
              </button>

              <button
                id="create-quick-page"
                type="button"
                onClick={() => {
                  if (isLimitReached) { setLimitWarning(true); return; }
                  setNewItemType("page");
                  setNewItemName("");
                  setShowCreateModal(true);
                }}
                className="flex flex-col items-start p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all text-left cursor-pointer group/btn"
              >
                <div className="w-9 h-9 bg-white rounded-xl shadow-xs mb-3 flex items-center justify-center text-lg group-hover/btn:scale-110 transition-transform">
                  <Layout className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="font-semibold text-xs text-slate-800">Webbsida</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Bygg landningssida</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Box 2: Premium Upgrade, Usage, & Compliance Block (col-span-5) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col justify-between text-white relative overflow-hidden border border-slate-800 shadow-lg">
          
          {/* Decorative radial gradient glow */}
          <div className="absolute -right-16 -bottom-16 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">DITT PAKET & LICENS</span>
              {subscription === "free" && (
                <span className="bg-slate-800 text-slate-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-700">
                  FREE TRIAL
                </span>
              )}
              {subscription === "office" && (
                <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md border border-indigo-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-400" /> OFFICE PACK
                </span>
              )}
              {subscription === "organization" && (
                <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-emerald-400" /> ORGANIZATION
                </span>
              )}
            </div>

            <div>
              <h4 className="font-display font-bold text-white text-lg">
                {subscription === "free" ? "Begränsat testläge" : subscription === "office" ? "Kreativt Personläge" : "Oändlig Skol- & Företagsåtkomst"}
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {subscription === "free" 
                  ? `Du kan lagra max ${FREE_LIMIT} projekt och saknar tillgång till AI-verktyget Gemini.` 
                  : subscription === "office" 
                  ? "Du har tillgång till obegränsat antal projekt samt full co-creation i samtliga editorer." 
                  : "Licensierat för skolor och företag. Oändlig tillgång för alla lärare, elever och anställda."}
              </p>
            </div>

            {/* Simulated usage gauge with exact matching styles */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>LAGRINGSUTRYMME ({subscription === "free" ? "1 GB" : subscription === "office" ? "500 GB" : "10 TB"})</span>
                  <span>{Math.round((totalStorageUsed / storageLimit) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${totalStorageUsed >= storageLimit ? "bg-red-500 animate-pulse" : subscription === "free" ? "bg-indigo-500" : "bg-emerald-500"}`} 
                    style={{ width: `${Math.min(100, (totalStorageUsed / storageLimit) * 100)}%` }}
                  ></div>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{formatBytes(totalStorageUsed)} använt</span>
                  <span>Gräns: {formatBytes(storageLimit)}</span>
                </div>
                
                {/* Upload / Import file button */}
                <label className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all mt-3 text-center border border-indigo-500 shadow-sm shadow-indigo-900/20 hover:scale-[1.02] duration-200">
                  <Upload className="w-3.5 h-3.5" />
                  Importera .kreative
                  <input 
                    type="file" 
                    accept=".kreative" 
                    className="hidden" 
                    onChange={handleUploadKreative} 
                  />
                </label>
              </div>

              {/* AI limit gauge specifically shown for Office Pack (or also general tracker) */}
              {subscription === "office" && (
                <div className="pt-3 border-t border-slate-800 animate-fade-in">
                  <div className="flex justify-between text-[10px] font-mono text-indigo-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> AI-GRÄNS (OFFICE PACK)
                    </span>
                    <span>{aiUsage} / {aiLimit} förfrågningar</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500 bg-indigo-500" 
                      style={{ width: `${Math.min(100, (aiUsage / aiLimit) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{aiLimit - aiUsage} kvar denna månad</span>
                    <span>Återställs månadsvis</span>
                  </div>
                </div>
              )}

              {/* Watermark status and quota */}
              {subscription === "free" && (
                <div className="pt-3 border-t border-slate-800 animate-fade-in">
                  <div className="flex justify-between text-[10px] font-mono text-red-400 mb-1">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-400 animate-pulse" /> VATTENSTÄMPEL (AKTIV)
                    </span>
                    <span>Aktiv</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Watermarks läggs till på alla skapelser och exporter i Free Trial. Uppgradera för att ta bort.
                  </p>
                </div>
              )}

              {subscription === "office" && (
                <div className="pt-3 border-t border-slate-800 animate-fade-in">
                  <div className="flex justify-between text-[10px] font-mono text-indigo-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" /> VATTENSTÄMPEL (OFFICE GRÄNS)
                    </span>
                    <span>{watermarkFreeLeft} / 25 gratis kvar</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${watermarkFreeLeft > 0 ? "bg-indigo-500" : "bg-red-500"}`} 
                      style={{ width: `${Math.min(100, (watermarkFreeLeft / 25) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 leading-normal">
                    {watermarkFreeLeft > 0 
                      ? `Du har ${watermarkFreeLeft} st gratis nedladdningar och skapelser kvar utan vattenstämpel.` 
                      : "Dina 25 gratis skapelser är förbrukade. Vattenstämpel är nu aktiv på nya filer."}
                  </p>
                </div>
              )}

              {subscription === "organization" && (
                <div className="pt-3 border-t border-slate-800 animate-fade-in">
                  <div className="flex justify-between text-[10px] font-mono text-emerald-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> VATTENSTÄMPEL (INAKTIV ✓)
                    </span>
                    <span>Helt inaktiv</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Organization Pack har inga vattenstämplar alls på några filer eller exporter.
                  </p>
                </div>
              )}
            </div>

            {/* School & Company notice with active license action buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Om du använder KREATIVE i skola eller företag måste du enligt EU:s skollagar aktivera <strong>Organization Pack</strong> för regelefterlevnad.
              </p>
              
              <div className="flex flex-col gap-2 pt-1">
                {subscription !== "organization" ? (
                  <button
                    id="activate-org-sim"
                    onClick={onNavigateToPricing}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1"
                  >
                    <Landmark className="w-3.5 h-3.5" /> Aktivera Organization Pack (349 kr)
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Licensierad för skolor och företag.</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-1">
                  <button
                    id="dash-pricing-btn"
                    onClick={onNavigateToPricing}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline transition-all"
                  >
                    Visa alla licensplaner
                  </button>

                  {subscription === "free" && (
                    <button
                      id="upgrade-link-badge"
                      onClick={onNavigateToPricing}
                      className="text-xs font-semibold text-slate-300 hover:text-white cursor-pointer flex items-center gap-0.5"
                    >
                      Uppgradera <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Organization / School Access Code Section (for Non-Org users) */}
      {subscription !== "organization" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 hover:border-slate-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide">
                Gå med i en skola eller organisation?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Har din lärare, skola eller arbetsgivare delat en inbjudningskod med dig? Fyll i koden till höger för att ansluta och få full Organization Pack-åtkomst direkt.
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto flex items-center gap-2 shrink-0">
            <input 
              type="text" 
              placeholder="Ex: KREATIVE-ORG-78A3" 
              id="input-org-code"
              className="px-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-mono font-bold w-full md:w-56"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const input = e.currentTarget;
                  if (input && onJoinOrg) {
                    const success = onJoinOrg(input.value);
                    if (success) input.value = "";
                  }
                }
              }}
            />
            <button
              id="btn-join-org"
              onClick={() => {
                const el = document.getElementById("input-org-code") as HTMLInputElement;
                if (el && onJoinOrg) {
                  const success = onJoinOrg(el.value);
                  if (success) el.value = "";
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              Anslut nu
            </button>
          </div>
        </div>
      )}

      {/* Organization simulated team stats (if active) */}
      {subscription === "organization" && (
        <div className="space-y-6">
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-6 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in hover:border-emerald-300 transition-colors">
            <div className="text-center md:text-left border-r border-emerald-200/60 last:border-0 pr-4">
              <div className="text-2xl font-display font-extrabold text-emerald-800">{orgMembers.length} st</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase font-bold mt-1">Aktiva medlemmar</div>
            </div>
            <div className="text-center md:text-left border-r border-emerald-200/60 last:border-0 pr-4">
              <div className="text-2xl font-display font-extrabold text-emerald-800">1 420 st</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase font-bold mt-1">Oändliga dokument</div>
            </div>
            <div className="text-center md:text-left border-r border-emerald-200/60 last:border-0 pr-4">
              <div className="text-2xl font-display font-extrabold text-emerald-800">Skolverket</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase font-bold mt-1">Lagringsefterlevnad</div>
            </div>
            <div className="text-center md:text-left last:border-0">
              <div className="text-2xl font-display font-extrabold text-emerald-800">✓ OÄNDLIG</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase font-bold mt-1">Sajttillgång</div>
            </div>
          </div>

          {/* Interactive Member & Code Administration Console */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fade-in">
            {/* Left Box: Active Invite Codes (col-span-5) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h4 className="font-display font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" /> Dela Inbjudningskoder
                  </h4>
                  <button
                    onClick={onAddInviteCode}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Skapa kod
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Dela dessa koder med elever, lärare eller kollegor. När de ansluter via sin instrumentpanel får de automatiskt tillgång till skollinsen.
                </p>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {inviteCodes.map((code) => (
                    <div key={code} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-xl font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{code}</span>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-sans font-bold px-1.5 py-0.5 rounded uppercase">Aktiv</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(code);
                            alert(`Kopierade kod till urklipp: ${code}`);
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-sans font-bold px-2 py-1 rounded cursor-pointer"
                        >
                          Kopiera
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Är du säker på att du vill ta bort inbjudningskoden ${code}?`)) {
                              if (onRemoveInviteCode) onRemoveInviteCode(code);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Radera kod"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {inviteCodes.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">Inga aktiva koder. Skapa en ny ovan!</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                Skapa unika koder för olika klassrum, kurser eller avdelningar.
              </div>
            </div>

            {/* Right Box: Member Administration (col-span-7) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 hover:border-slate-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h4 className="font-display font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" /> Medlemmar ({orgMembers.length})
                  </h4>
                </div>

                {/* Members List */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {orgMembers.map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-display font-black text-xs shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            {member.name}
                            <span className={`text-[8px] font-sans font-bold px-1.5 py-0.5 rounded ${
                              member.role === "Lärare" || member.role === "Administratör" 
                                ? "bg-purple-100 text-purple-800" 
                                : "bg-slate-200 text-slate-700"
                            }`}>
                              {member.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{member.email}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Vill du ta bort ${member.name} från organisationen?`)) {
                            if (onRemoveOrgMember) onRemoveOrgMember(member.email);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Ta bort medlem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Add Form */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Lägg till / Bjud in medlem manuellt</h5>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const nameEl = form.elements.namedItem("memberName") as HTMLInputElement;
                    const emailEl = form.elements.namedItem("memberEmail") as HTMLInputElement;
                    const roleEl = form.elements.namedItem("memberRole") as HTMLSelectElement;
                    if (nameEl && emailEl && roleEl && onAddOrgMember) {
                      onAddOrgMember(nameEl.value, roleEl.value, emailEl.value);
                      nameEl.value = "";
                      emailEl.value = "";
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <input 
                    type="text" 
                    name="memberName"
                    placeholder="Namn" 
                    required
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl text-xs"
                  />
                  <input 
                    type="email" 
                    name="memberEmail"
                    placeholder="E-post" 
                    required
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl text-xs"
                  />
                  <div className="flex gap-2">
                    <select 
                      name="memberRole"
                      className="px-2 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl text-xs flex-1"
                    >
                      <option value="Elev">Elev</option>
                      <option value="Lärare">Lärare</option>
                      <option value="Administratör">Administratör</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      Lägg till
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Integration Control Panel */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-2xl shrink-0 ${user ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <Cloud className={`w-6 h-6 ${isLoadingDrive ? 'animate-bounce' : ''}`} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-slate-900 text-base uppercase tracking-tight">
                  Google Drive Molnlagring
                </h3>
                {user ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ANSLUTEN 🟢
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-200">
                    FRÅNKOPPLAD ⚪
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                {user ? (
                  <>
                    Dina skapelser lagras säkert i din Google Drive under mappen <strong className="text-slate-700 font-mono">/KREATIVE Workspace</strong>. Ändringar i editorn sparas automatiskt i realtid. Logga ut eller koppla ifrån för att återgå till lokalt läge.
                  </>
                ) : (
                  <>
                    Spara dina dokument och hemsidor säkert i molnet! Genom att ansluta Google Drive lagras alla dina skapelser direkt på din personliga Drive. Det skyddar mot dataförlust och låter dig komma åt dina filer på alla dina enheter.
                  </>
                )}
              </p>
              {driveError && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {driveError}
                </p>
              )}
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-wrap items-center gap-3 shrink-0">
            {isLoadingDrive ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                <span>Synkroniserar Drive...</span>
              </div>
            ) : user ? (
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="hidden lg:flex flex-col text-right pr-2">
                  <span className="text-[10px] font-bold text-slate-400 font-mono leading-none">ANVÄNDARE</span>
                  <span className="text-xs font-bold text-slate-700 mt-1">{user.displayName || user.email}</span>
                </div>
                
                <button
                  id="btn-import-local"
                  onClick={onImportLocal}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  title="Ladda upp dina sparade lokala filer till Google Drive"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Överför lokala filer</span>
                </button>

                <button
                  id="btn-disconnect-drive"
                  onClick={onLogout}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Koppla från</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-connect-drive"
                onClick={onLogin}
                className="gsi-material-button w-full md:w-auto"
                style={{
                  backgroundColor: "white",
                  border: "1px solid #747775",
                  borderRadius: "12px",
                  boxSizing: "border-box",
                  color: "#1f1f1f",
                  cursor: "pointer",
                  fontFamily: '"Inter", sans-serif',
                  fontSize: "14px",
                  fontWeight: "500",
                  height: "40px",
                  letterSpacing: "0.25px",
                  outline: "none",
                  overflow: "hidden",
                  padding: "0 12px",
                  position: "relative",
                  textAlign: "center",
                  transition: "background-color .218s, border-color .218s, box-shadow .218s",
                  verticalAlign: "middle",
                  whiteSpace: "nowrap",
                  width: "auto",
                  maxWidth: "400px",
                  minWidth: "min-content",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px" }}>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "100%", height: "100%" }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>Logga in med Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Templates library area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-bold text-slate-900 text-lg">Skapa utifrån färdiga mallar</h3>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              id="filter-tpl-doc"
              onClick={() => setTemplateFilter("document")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${templateFilter === "document" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
            >
              Dokument
            </button>
            <button
              id="filter-tpl-pres"
              onClick={() => setTemplateFilter("presentation")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${templateFilter === "presentation" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
            >
              Presentationer
            </button>
            <button
              id="filter-tpl-page"
              onClick={() => setTemplateFilter("page")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${templateFilter === "page" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
            >
              Sidor
            </button>
            <button
              id="filter-tpl-video"
              onClick={() => setTemplateFilter("video")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${templateFilter === "video" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
            >
              Videor
            </button>
            <button
              id="filter-tpl-story"
              onClick={() => setTemplateFilter("story")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${templateFilter === "story" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
            >
              Stories
            </button>
          </div>
        </div>

        {/* Template cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {TEMPLATES.filter(t => t.type === templateFilter).map((template) => {
            const isLocked = template.isPremium && subscription === "free";
            const isOrgLocked = template.isOrgOnly && subscription !== "organization";
            const IconComp = 
              template.type === "document" ? FileText : 
              template.type === "presentation" ? Monitor : 
              template.type === "video" ? Video : 
              template.type === "story" ? Sparkles : 
              Layout;

            return (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="group p-6 border border-slate-200 hover:border-indigo-400 bg-white rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between min-h-[150px] hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      <IconComp className="w-4 h-4" />
                    </div>
                    {template.isOrgOnly ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-md font-mono uppercase">
                        Org Endast
                      </span>
                    ) : template.isPremium ? (
                      <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-md font-mono uppercase">
                        Premium
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-md font-mono uppercase">
                        Gratis
                      </span>
                    )}
                  </div>

                  <h4 className="font-display font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-all">
                    {template.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 pr-6 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Lock Overlay Badge if restricted */}
                {(isLocked || isOrgLocked) && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <span className="bg-slate-950/90 text-white font-semibold text-[10px] px-3.5 py-2 rounded-2xl flex items-center gap-1.5 shadow-md font-mono uppercase tracking-wide">
                      <AlertCircle className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      Lås upp i {isOrgLocked ? "Org Pack" : "Premium"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Existing documents area */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-display font-bold text-slate-900 text-lg">Mina skapade objekt</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="search-input"
                placeholder="Sök dina projekt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs w-56 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Type selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                id="filter-type-all"
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterType === "all" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
              >
                Alla
              </button>
              <button
                id="filter-type-doc"
                onClick={() => setFilterType("document")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterType === "document" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
              >
                Dokument
              </button>
              <button
                id="filter-type-pres"
                onClick={() => setFilterType("presentation")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterType === "presentation" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
              >
                Presentationer
              </button>
              <button
                id="filter-type-page"
                onClick={() => setFilterType("page")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterType === "page" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
              >
                Sidor
              </button>
              <button
                id="filter-type-video"
                onClick={() => setFilterType("video")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterType === "video" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
              >
                Videor
              </button>
              <button
                id="filter-type-story"
                onClick={() => setFilterType("story")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filterType === "story" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
              >
                Stories
              </button>
            </div>
          </div>
        </div>

        {/* Existing items grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const IconComp = item.type === "document" ? FileText : item.type === "presentation" ? Monitor : item.type === "video" ? Video : item.type === "story" ? Sparkles : Layout;
              const typeLabel = item.type === "document" ? "Dokument" : item.type === "presentation" ? "Presentation" : item.type === "video" ? "Video" : item.type === "story" ? "Story" : "Sida";
              
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className="group bg-white p-6 border border-slate-200 hover:border-indigo-500 rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between min-h-[170px] relative hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wide flex items-center gap-1">
                          <IconComp className="w-3.5 h-3.5" />
                          {typeLabel}
                        </div>
                        {item.driveFileId && (
                          <div className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wide flex items-center gap-1" title="Sparad i Google Drive">
                            <Cloud className="w-3 h-3" />
                            <span>MOLN</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Export/Download .kreative button */}
                      <button
                        id={`download-btn-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadKreative(item);
                        }}
                        className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-all mr-1"
                        title="Ladda ner som .kreative"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Delete project button */}
                      <button
                        id={`delete-btn-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Är du säker på att du vill ta bort "${item.name}"?`)) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                        title="Ta bort projekt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-display font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-all line-clamp-1 pr-4">
                      {item.name}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                      <span>Skapad: {new Date(item.createdAt).toLocaleDateString("sv-SE")}</span>
                      <span className="bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 text-[9px] text-slate-500 font-bold">{formatBytes(getItemSize(item))}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-indigo-600 font-semibold mt-4">
                    <span>Öppna i editor</span>
                    <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 max-w-md mx-auto">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-pulse" />
            <p className="text-slate-500 text-sm">Inga skapade projekt hittades.</p>
            <button
              id="dash-create-empty-btn"
              onClick={handleCreatePrompt}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              Kom igång nu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
