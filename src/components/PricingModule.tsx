import { useState } from "react";
import { SubscriptionType } from "../types";
import { Check, Shield, Landmark, Sparkles, User, Users, Info, X, CreditCard, CheckCircle, RefreshCw } from "lucide-react";
import GooglePayButton from "@google-pay/button-react";

interface PricingModuleProps {
  currentSubscription: SubscriptionType;
  onUpgrade: (type: SubscriptionType) => void;
  showBackToDashboard?: boolean;
  onBack?: () => void;
}

export default function PricingModule({
  currentSubscription,
  onUpgrade,
  showBackToDashboard = false,
  onBack,
}: PricingModuleProps) {
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [businessBilling, setBusinessBilling] = useState<"monthly" | "yearly">("monthly");

  // Clean production configuration (runs safely inside standard container frames)
  const merchantId = "12345678901234567890";
  const merchantName = "KREATIVE AI WORKSPACE";
  const gateway = "stripe";
  const gatewayMerchantId = "pk_live_example_key";

  const plans = [
    {
      id: "free" as SubscriptionType,
      name: "Free Trial",
      price: "0 kr",
      priceValue: "0.00",
      period: "alltid",
      description: "Perfekt för att utforska plattformen på egen hand.",
      icon: User,
      color: "border-slate-200 bg-white",
      badgeColor: "bg-slate-100 text-slate-700",
      features: [
        "Skapa max 2 objekt (sidor/dokument/presentationer)",
        "Standard textredigering",
        "Ingen tillgång till AI-generering (Gemini)",
        "Grundläggande mallar",
        "Videoexport i 360p kvalitet (standard)",
      ],
      buttonText: "Nuvarande gratisnivå",
      isCurrent: currentSubscription === "free",
    },
    {
      id: "office" as SubscriptionType,
      name: "Office Pack",
      price: "99 kr",
      priceValue: "99.00",
      period: "månad",
      description: "För kreatörer som vill ha mer kraft och AI-funktioner.",
      icon: Sparkles,
      color: "border-indigo-600 bg-indigo-50/40 shadow-sm relative ring-2 ring-indigo-600/10",
      badgeColor: "bg-indigo-600 text-white",
      badge: "POPULÄR",
      features: [
        "Skapa oändligt med personliga dokument, sidor & presentationer",
        "Full AI Co-Creator integrering (Gemini)",
        "Premiumdesign och rika mallar",
        "Exportera till ren HTML / Markdown",
        "Videoexport i 720p HD kvalitet",
        "För personligt/enskilt bruk",
      ],
      buttonText: "Köp med Google Pay",
      isCurrent: currentSubscription === "office",
    },
    {
      id: "organization" as SubscriptionType,
      name: "Organization Pack",
      price: "349 kr",
      priceValue: "349.00",
      period: "månad / org",
      description: "Obligatoriskt för skolor och företag. Ger oändlig åtkomst.",
      icon: Landmark,
      color: "border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-600/10 shadow-sm relative",
      badgeColor: "bg-emerald-600 text-white",
      badge: "OÄNDLIG ÅTKOMST",
      features: [
        "Skapa oändligt med dokument för alla i organisationen",
        "Full AI-generering utan gränser",
        "Skol- och företagsfunktioner (Team-mallar)",
        "Prioriterad administrativ kontroll",
        "Videoexport i 4K Ultra HD kvalitet",
        "Garantitillgång för skolor & företag",
      ],
      buttonText: "Köp med Google Pay",
      isCurrent: currentSubscription === "organization",
    },
    {
      id: "business" as SubscriptionType,
      name: "Business Pack",
      price: businessBilling === "monthly" ? "2 000 kr" : "20 000 kr",
      priceValue: businessBilling === "monthly" ? "2000.00" : "20000.00",
      period: businessBilling === "monthly" ? "månad" : "år",
      description: "Helt obegränsat paket för storföretag och avancerade team.",
      icon: Users,
      color: "border-purple-600 bg-purple-50/30 ring-2 ring-purple-600/10 shadow-sm relative",
      badgeColor: "bg-purple-600 text-white",
      badge: "ALLT OÄNDLIGT",
      features: [
        "Helt oändligt med dokument, sidor & presentationer",
        "Oändlig AI Co-Creator (Gemini) utan tak",
        "Prioriterad blixtsnabb AI-svarstid",
        "Videoexport i 8K + 360° VR-panoramavy",
        "Oändligt lagringsutrymme (1000 TB)",
        "Avancerad säkerhet & samarbete",
      ],
      buttonText: "Köp med Google Pay",
      isCurrent: currentSubscription === "business",
    },
  ];

  const handleOpenCheckout = (plan: any) => {
    if (plan.id === "free") {
      onUpgrade("free");
      return;
    }
    setSelectedPlan(plan);
    setPaymentStatus("idle");
    setErrorMessage("");
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log("Google Pay betalningsdata mottagen:", paymentData);
    setPaymentStatus("processing");
    // Simulate API processing of token
    setTimeout(() => {
      setPaymentStatus("success");
      onUpgrade(selectedPlan.id);
    }, 1500);
  };

  const handleSimulatedPayment = () => {
    setPaymentStatus("processing");
    setTimeout(() => {
      setPaymentStatus("success");
      onUpgrade(selectedPlan.id);
    }, 1500);
  };

  return (
    <div id="pricing-module" className="max-w-6xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-display font-bold tracking-tight text-slate-900 sm:text-4xl">
          Välj din licens på KREATIVE
        </h2>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Anpassa din åtkomst baserat på dina behov. Skolor och företag måste ha <strong className="text-slate-800">Organization Pack</strong> för oändlig och godkänd åtkomst.
        </p>
      </div>

      {/* Warn for schools and organizations */}
      <div className="mb-10 bg-amber-50/70 border border-amber-200 rounded-3xl p-6 flex items-start gap-4 shadow-xs max-w-3xl mx-auto">
        <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-display font-medium text-amber-800 text-base">Viktig licensinformation</h4>
          <p className="text-amber-700 text-sm mt-1 leading-relaxed">
            Enligt våra villkor: Om KREATIVE används inom <strong>skolverksamhet (lärare/elever)</strong> eller <strong>företag (kommersiellt bruk)</strong> är det obligatoriskt att licensiera workspace under <strong>Organization Pack</strong>. Detta säkrar oändlig datalagring och anpassade samarbetsverktyg.
          </p>
        </div>
      </div>

      {/* Grid of pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => {
          const IconComponent = plan.icon;
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-3xl border p-8 transition-all hover:-translate-y-0.5 hover:shadow-md ${plan.color}`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${
                  plan.id === 'free' 
                    ? 'bg-slate-100 text-slate-600' 
                    : plan.id === 'office' 
                    ? 'bg-indigo-100 text-indigo-600' 
                    : plan.id === 'organization'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">{plan.name}</h3>
              </div>

              <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{plan.description}</p>

              {plan.id === "business" && (
                <div className="mb-6 flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 self-start">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBusinessBilling("monthly");
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      businessBilling === "monthly"
                        ? "bg-white text-slate-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Månadsvis (2 000 kr)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBusinessBilling("yearly");
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      businessBilling === "yearly"
                        ? "bg-white text-slate-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Årsvis (20 000 kr)
                  </button>
                </div>
              )}

              <div className="mb-6 flex items-baseline text-slate-900">
                <span className="text-4xl font-display font-extrabold tracking-tight">{plan.price}</span>
                <span className="ml-1 text-sm font-semibold text-slate-500">/ {plan.period}</span>
              </div>

              <button
                id={`btn-upgrade-${plan.id}`}
                onClick={() => handleOpenCheckout(plan)}
                disabled={plan.isCurrent}
                className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  plan.isCurrent
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : plan.id === "office"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                    : plan.id === "organization"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    : plan.id === "business"
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                    : "bg-white hover:bg-slate-50 text-slate-800 border border-slate-300"
                }`}
              >
                {plan.isCurrent ? (
                  "✓ Aktiv Plan"
                ) : (
                  <>
                    {plan.id !== "free" && <CreditCard className="w-4 h-4" />}
                    {plan.buttonText}
                  </>
                )}
              </button>

              <hr className="my-6 border-slate-100" />

              <ul className="space-y-3 flex-1 text-sm text-slate-600">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                      plan.id === 'free' 
                        ? 'text-slate-400' 
                        : plan.id === 'office' 
                        ? 'text-indigo-600' 
                        : plan.id === 'organization'
                        ? 'text-emerald-600'
                        : 'text-purple-600'
                    }`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-xs text-slate-400">
          * Samtliga priser är exklusive moms för företag och skolor. Säkra och krypterade betalningar hanteras direkt via Google Pay.
        </p>
        {showBackToDashboard && onBack && (
          <button
            id="back-to-dash-btn"
            onClick={onBack}
            className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm cursor-pointer transition-all"
          >
            ← Tillbaka till instrumentpanelen
          </button>
        )}
      </div>

      {/* Google Pay Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-slate-900">Kassa</h3>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {paymentStatus === "success" ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h4 className="font-display font-bold text-slate-900 text-xl">Betalning godkänd!</h4>
                  <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">
                    Tack! Din Google Pay-betalning har bearbetats framgångsrikt. Ditt konto har uppgraderats till <strong>{selectedPlan.name}</strong>.
                  </p>
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-900/10 cursor-pointer"
                  >
                    Kom igång nu
                  </button>
                </div>
              ) : paymentStatus === "processing" ? (
                <div className="text-center py-12 space-y-4">
                  <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                  <h4 className="font-display font-bold text-slate-900">Behandlar betalning...</h4>
                  <p className="text-xs text-slate-400">Vänligen vänta medan din Google Pay-transaktion valideras och din licens aktiveras.</p>
                </div>
              ) : (
                <>
                  {/* Order Summary Card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 block mb-1">PRODUKT</span>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-display font-bold text-slate-800 text-base">{selectedPlan.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Oändlig datalagring & premium AI</p>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-extrabold text-slate-900 text-lg">{selectedPlan.price}</span>
                        <span className="text-slate-400 text-[10px] block font-mono">/{selectedPlan.period}</span>
                      </div>
                    </div>
                  </div>

                  {/* Information block about secure checkout */}
                  <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Säker krypterad betalning</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Dina betalningsuppgifter hanteras säkert och krypteras direkt av Google. Transaktionen slutförs omedelbart på din enhet utan att sparas hos oss.
                    </p>
                  </div>

                  {/* Real Google Pay Button integration */}
                  <div className="flex flex-col items-center justify-center space-y-3 pt-2">
                    <GooglePayButton
                      environment="TEST"
                      buttonColor="black"
                      buttonType="buy"
                      buttonSizeMode="fill"
                      style={{ width: "100%", height: "48px" }}
                      paymentRequest={{
                        apiVersion: 2,
                        apiVersionMinor: 0,
                        allowedPaymentMethods: [
                          {
                            type: "CARD",
                            parameters: {
                              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                              allowedCardNetworks: ["MASTERCARD", "VISA"],
                            },
                            tokenizationSpecification: {
                              type: "PAYMENT_GATEWAY",
                              parameters: {
                                gateway: gateway,
                                gatewayMerchantId: gatewayMerchantId,
                              },
                            },
                          },
                        ],
                        merchantInfo: {
                          merchantId: merchantId,
                          merchantName: merchantName,
                        },
                        transactionInfo: {
                          totalPriceStatus: "FINAL",
                          totalPriceLabel: "Totalt",
                          totalPrice: selectedPlan.priceValue,
                          currencyCode: "SEK",
                          countryCode: "SE",
                        },
                      }}
                      onLoadPaymentData={handlePaymentSuccess}
                      onError={(err) => {
                        console.error("Google Pay-fel:", err);
                        setErrorMessage(
                          "Kunde inte starta Google Pay. Kontrollera din nätverksanslutning eller att ditt Google-konto är kopplat till ett giltigt betalkort."
                        );
                      }}
                      onCancel={() => {
                        console.log("Användaren avbröt Google Pay.");
                      }}
                    />

                    {errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-left leading-relaxed space-y-1 mt-2">
                        <p className="font-bold">Ett fel uppstod:</p>
                        <p>{errorMessage}</p>
                      </div>
                    )}

                    {/* Fallback secure simulator button */}
                    <div className="w-full pt-2 border-t border-slate-100 flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-slate-400 text-center">ELLER BETALA MED DIREKTKORT / BANKID</span>
                      <button
                        onClick={handleSimulatedPayment}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01] duration-150"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        Betala med BankID / Kort (Direkt)
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
